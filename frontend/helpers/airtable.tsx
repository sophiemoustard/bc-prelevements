import { base } from '@airtable/blocks';
import lodash from 'lodash';
import { isValidIBAN, isValidBIC, isValidICS, isValidPrefix, isValidName, isValidTransactionLabel } from './validations';
import { throwValidationError, addMessageAndThrow } from './errors';
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
  RENT_FIELD_ID,
  RENTAL_EXPENSES_FIELD_ID,
  CURRENT_EXPENSES_FIELD_ID,
  HISTORY_TABLE_ID,
  HISTORY_AMOUNT_FIELD_ID,
  HISTORY_DATE_FIELD_ID,
  HISTORY_DEBITOR_NAME_FIELD_ID,
  HISTORY_IBAN_FIELD_ID,
  HISTORY_RUM_FIELD_ID,
  HISTORY_TRANSACTION_ID_FIELD_ID,
  HISTORY_TRANSACTION_NUMBER_FIELD_ID,
  HISTORY_TYPE_FIELD_ID,
  BATCH_SIZE,
} from '../data/constants';
import dayjs from 'dayjs';

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
  if (
    !isValidTransactionLabel(data.rentLabel) ||
    !isValidTransactionLabel(data.rentalExpensesLabel) ||
    !isValidTransactionLabel(data.currentExpensesLabel)) {
      errors.push('les libellés doivent contenir au maximum 140 caractères,');
  }

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
      rentLabel: configRecord.getCellValue(RENT_FIELD_ID),
      rentalExpensesLabel: configRecord.getCellValue(RENTAL_EXPENSES_FIELD_ID),
      currentExpensesLabel: configRecord.getCellValue(CURRENT_EXPENSES_FIELD_ID),
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

export const getTransactionsHistoryData = async () => {
  let queryResult;
  try {
    const transactionsHistoryTable = base.getTable(HISTORY_TABLE_ID);
    queryResult = await transactionsHistoryTable.selectRecordsAsync();

    const historiesData = queryResult.records.map(record => ({
      date: record.getCellValue(HISTORY_DATE_FIELD_ID),
      RUM: record.getCellValue(HISTORY_RUM_FIELD_ID)
    }));
  
  return historiesData;
  } catch (e) {
    addMessageAndThrow(e, 'error during extraction of history table');
  } finally {
    if (queryResult && queryResult.isDataLoaded) queryResult.unloadData();
  }
};

export const createTransactionsHistoryRecords = async (transactionsData) => {
  try {
    const table = base.getTable(HISTORY_TABLE_ID);

    const records = transactionsData.map(transaction => ({
      fields: {
        [HISTORY_TRANSACTION_ID_FIELD_ID]: transaction.id,
        [HISTORY_TRANSACTION_NUMBER_FIELD_ID]: transaction.number,
        [HISTORY_AMOUNT_FIELD_ID]: transaction.amount.toString(),
        [HISTORY_TYPE_FIELD_ID]: transaction.expenseLabel,
        [HISTORY_DEBITOR_NAME_FIELD_ID]: transaction.debitorName,
        [HISTORY_IBAN_FIELD_ID]: transaction.debitorIBAN,
        [HISTORY_RUM_FIELD_ID]: transaction.debitorRUM,
        [HISTORY_DATE_FIELD_ID]: dayjs().toISOString(),
      }
    }))

    await addRecords(table, records);
  } catch (e) {
    addMessageAndThrow(e, 'error during history transactions saving');
  }
};


export const addRecords = async (table, data) => {
  try {
    const recordsBatches = lodash.chunk(data, BATCH_SIZE);
    await Promise.all(recordsBatches.map((records: typeof data) => table.createRecordsAsync(records)));
  } catch (e) {
    addMessageAndThrow(e, 'error during records creation');
  }
};
