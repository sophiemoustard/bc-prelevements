import { base } from '@airtable/blocks';
import { isValidIBAN, isValidBIC, isValidICS, isValidPrefix, isValidName } from './validations';
import { throwValidationError, addMessageAndThrow } from './errors';
import dayjs from 'dayjs';
import ObjectID from 'bson-objectid';
import {
  CONFIG_TABLE_ID,
  CREDITOR_NAME_FIELD_ID,
  CREDITOR_IBAN_FIELD_ID,
  CREDITOR_BIC_FIELD_ID,
  CREDITOR_PREFIX_FIELD_ID,
  ROOMMATES_TABLE_ID,
  ROOMMATE_FIELD_ID,
  IBAN_FIELD_ID,
  RUM_FIELD_ID,
  BIC_FIELD_ID,
  ICS_FIELD_ID,
  HISTORY_TABLE,
  HISTORY_DEBITOR_NAME_FIELD_ID,
  HISTORY_TRANSACTION_NUMBER_FIELD_ID,
  HISTORY_TRANSACTION_ID_FIELD_ID,
  HISTORY_AMOUNT_FIELD_ID,
  HISTORY_RUM_FIELD_ID,
  HISTORY_IBAN_FIELD_ID,
  HISTORY_DATE_FIELD_ID,
  HISTORY_TYPE_FIELD_ID,
  RENT_FIELD_ID,
  RENTAL_EXPENSES_FIELD_ID,
  CURRENT_EXPENSES_FIELD_ID,
  AMOUNTS_NATURE,
  CURRENT_EXPENSES,
  RENT,
  RENTAL_EXPENSES,
} from '../data/constants';
import { formatTransactionNumber } from './sepa';

const validateConfigTableLength = (queryResult) => {
  if (queryResult.records.length !== 1) {
    throwValidationError('Erreur dans la table CONFIGURATIONS: cette table doit contenir une et une seule ligne.');
  }
};

const validateConfigTableContent = (data) => {
  const errors = [];
  if (!isValidName(data.creditorName)) errors.push('le nom du créancier doit contenir au maximum 70 caractères,');
  if (!isValidICS(data.ics)) errors.push('l\'ICS est invalide,');
  if (!isValidIBAN(data.creditorIBAN)) errors.push('l\'IBAN est invalide,');
  if (!isValidBIC(data.creditorBIC)) errors.push('le BIC est invalide,');
  if (!isValidPrefix(data.creditorPrefix)) errors.push('le préfixe doit contenir exactement trois chiffres,');

  if (errors.length) {
    throwValidationError(['Erreur(s) dans la table CONFIGURATIONS:', ...errors].join(' '));
  }
};

export const getConfigData = async () => {
  let queryResult;
  try {
    const configTable = base.getTable(CONFIG_TABLE_ID);
    const queryResult = await configTable.selectRecordsAsync();
    validateConfigTableLength(queryResult);

    const configRecord = queryResult.records[0];
    const configs = {
      creditorName: configRecord.getCellValue(CREDITOR_NAME_FIELD_ID),
      ics: configRecord.getCellValue(ICS_FIELD_ID),
      creditorIBAN: configRecord.getCellValue(CREDITOR_IBAN_FIELD_ID),
      creditorBIC: configRecord.getCellValue(CREDITOR_BIC_FIELD_ID),
      creditorPrefix: configRecord.getCellValue(CREDITOR_PREFIX_FIELD_ID),
    }
    validateConfigTableContent(configs);
    
    return configs;
  } catch (e) {
    addMessageAndThrow(e, 'error during extraction of configuration table');
  } finally {
    if (queryResult && queryResult.isDataLoaded) queryResult.unloadData();
  }
};

export const getRoommatesData = async () => {
  const roommatesTable = base.getTable(ROOMMATES_TABLE_ID);
  const queryResult = await roommatesTable.selectRecordsAsync();

  const roommatesData = queryResult.records.map(record => ({
    debitorName: record.getCellValue(ROOMMATE_FIELD_ID),
    debitorIBAN: record.getCellValue(IBAN_FIELD_ID),
    debitorRUM: record.getCellValue(RUM_FIELD_ID),
    debitorBIC: record.getCellValue(BIC_FIELD_ID),
  }));

  queryResult.unloadData();
  return roommatesData;
};

export const getTransactionsHistoryForCurrentMonthAndRUMs = async (month) => {
  let queryResult;
  let transactionMonthNumber = 1;
  let RUMs = [];
  try {
    const transactionsHistoryTable = base.getTable(HISTORY_TABLE);
    queryResult = await transactionsHistoryTable.selectRecordsAsync();

    const formattedHistories = queryResult.records.map(record => ({
      date: record.getCellValue(HISTORY_DATE_FIELD_ID),
      RUM: record.getCellValue(HISTORY_RUM_FIELD_ID),
    }));

    for (const history of formattedHistories) {
      if (dayjs(history.date).get('month') === month) transactionMonthNumber += 1;
      if (!RUMs.includes(history.RUM)) RUMs.push(history.RUM);
    }

    return { transactionMonthNumber, RUMs };
  } catch (e) {
    console.error(e);
  } finally {
    if (queryResult && queryResult.isDataLoaded) queryResult.unloadData();
  }
};

export const createHistories = async (amounts) => {
  let rentTransactions = [];
  let rentalExpenseTransactions = [];
  let currentExpenseTransations = [];
  let transactionNumber;
  try {
    const transactionsHistoryTable = base.getTable(HISTORY_TABLE);
    const roommatesData = await getRoommatesData();
    const configData = await getConfigData();

    const natures = [
      {label: configData.rent, value: RENT },
      {label: configData.rentalExpenses, value: RENTAL_EXPENSES },
      {label: configData.currentExpenses, value: CURRENT_EXPENSES },
    ];
    const date = dayjs().toISOString();
    const month = dayjs(date).get('month');
    const prefixDate = dayjs(date).format('MMYY');
    let { transactionMonthNumber } = await getTransactionsHistoryForCurrentMonthAndRUMs(month);

    for (const roommate of roommatesData) {
      for (const nature of AMOUNTS_NATURE) {
        transactionNumber = formatTransactionNumber(configData.creditorPrefix, prefixDate, transactionMonthNumber);
        const historyData = {
          [transactionsHistoryTable.getFieldById(HISTORY_DEBITOR_NAME_FIELD_ID).name] : roommate.debitorName,
          [transactionsHistoryTable.getFieldById(HISTORY_TRANSACTION_NUMBER_FIELD_ID).name]: transactionNumber,
          [transactionsHistoryTable.getFieldById(HISTORY_TRANSACTION_ID_FIELD_ID).name]: ObjectID().toHexString(),
          [transactionsHistoryTable.getFieldById(HISTORY_AMOUNT_FIELD_ID).name]: amounts[nature],
          [transactionsHistoryTable.getFieldById(HISTORY_RUM_FIELD_ID).name]: roommate.debitorRUM,
          [transactionsHistoryTable.getFieldById(HISTORY_IBAN_FIELD_ID).name]: roommate.debitorIBAN,
          [transactionsHistoryTable.getFieldById(HISTORY_DATE_FIELD_ID).name]: date,
          [transactionsHistoryTable.getFieldById(HISTORY_TYPE_FIELD_ID).name]: natures.find(item => item.value === nature).label,
        };

        await transactionsHistoryTable.createRecordAsync(historyData);

        if (nature === RENT) rentTransactions.push(historyData);
        else if (nature === RENTAL_EXPENSES) rentalExpenseTransactions.push(historyData);
        currentExpenseTransations.push(historyData);
        transactionMonthNumber += 1;
      }
    }

    return {rentTransactions, rentalExpenseTransactions, currentExpenseTransations };
  } catch (e) {
    console.error(e, 'error during creation of histories table');
  }
};

