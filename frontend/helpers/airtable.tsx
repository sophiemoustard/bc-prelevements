import { base } from '@airtable/blocks';
import { isValidIBAN, isValidBIC, isValidICS, isValidPrefix, isValidName } from './validations';
import { throwValidationError, addMessageAndThrow } from './errors';
import dayjs from 'dayjs';
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

export const createHistories = async (amounts) => {
  let rentTransactions = [];
  let rentalExpenseTransactions = [];
  let currentExpenseTransations = [];

  try {
    const historiesTable = base.getTable(HISTORY_TABLE);

    const roommatesData = await getRoommatesData();
    const configData = await getConfigData();

    const natures = [
      {label: configData.rent, value: RENT },
      {label: configData.rentalExpenses, value: RENTAL_EXPENSES },
      {label: configData.currentExpenses, value: CURRENT_EXPENSES },
    ];


    for (const roommate of roommatesData) {
      for (const nature of AMOUNTS_NATURE) {
        const historyData = {
          [historiesTable.getFieldById(HISTORY_DEBITOR_NAME_FIELD_ID).name] : roommate.debitorName,
          [historiesTable.getFieldById(HISTORY_TRANSACTION_NUMBER_FIELD_ID).name]: '2354657',
          [historiesTable.getFieldById(HISTORY_TRANSACTION_ID_FIELD_ID).name]: 'id',
          [historiesTable.getFieldById(HISTORY_AMOUNT_FIELD_ID).name]: amounts[nature],
          [historiesTable.getFieldById(HISTORY_RUM_FIELD_ID).name]: roommate.debitorRUM,
          [historiesTable.getFieldById(HISTORY_IBAN_FIELD_ID).name]: roommate.debitorIBAN,
          [historiesTable.getFieldById(HISTORY_DATE_FIELD_ID).name]: dayjs().toISOString(),
          [historiesTable.getFieldById(HISTORY_TYPE_FIELD_ID).name]: natures.find(item => item.value === nature).label,
        };

        await historiesTable.createRecordAsync(historyData);

        if (nature === 'rent') rentTransactions.push(historyData);
        else if (nature === 'rentalExpenses') rentalExpenseTransactions.push(historyData);
        currentExpenseTransations.push(historyData);
      }
    }

    return {rentTransactions, rentalExpenseTransactions, currentExpenseTransations };
  } catch (e) {
    console.error(e);
  }
  //   addMessageAndThrow(e, 'error during creation of histories table');
};
