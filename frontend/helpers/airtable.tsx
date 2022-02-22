import { base } from '@airtable/blocks';
import chunk from 'lodash.chunk';
import {
  isValidIBAN,
  isValidBIC,
  isValidICS,
  isValidPrefix,
  isValidName,
  isValidTransactionLabel,
  isValidRUM,
  isValidDate,
} from './validations';
import { throwValidationError, addMessageAndThrow } from './errors';
import {
  CONFIG_TABLE_ID,
  CREDITOR_NAME_FIELD_ID,
  CREDITOR_IBAN_FIELD_ID,
  CREDITOR_BIC_FIELD_ID,
  CREDITOR_PREFIX_FIELD_ID,
  CREDITOR_ICS_FIELD_ID,
  RENT_LABEL_FIELD_ID,
  RENTAL_EXPENSES_LABEL_FIELD_ID,
  CURRENT_EXPENSES_LABEL_FIELD_ID,
  ROOMMATES_TABLE_ID,
  ROOMMATE_NAME_FIELD_ID,
  ROOMMATE_IBAN_FIELD_ID,
  ROOMMATE_RUM_FIELD_ID,
  ROOMMATE_BIC_FIELD_ID,
  MANDATE_SIGNATURE_DATE_FIELD_ID,
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
    queryResult = await configTable.selectRecordsAsync();
    validateConfigTableLength(queryResult);

    const configRecord = queryResult.records[0];
    const configs = {
      creditorName: configRecord.getCellValue(CREDITOR_NAME_FIELD_ID),
      ics: configRecord.getCellValue(CREDITOR_ICS_FIELD_ID),
      creditorIBAN: configRecord.getCellValue(CREDITOR_IBAN_FIELD_ID),
      creditorBIC: configRecord.getCellValue(CREDITOR_BIC_FIELD_ID),
      creditorPrefix: configRecord.getCellValue(CREDITOR_PREFIX_FIELD_ID),
      rentLabel: configRecord.getCellValue(RENT_LABEL_FIELD_ID),
      rentalExpensesLabel: configRecord.getCellValue(RENTAL_EXPENSES_LABEL_FIELD_ID),
      currentExpensesLabel: configRecord.getCellValue(CURRENT_EXPENSES_LABEL_FIELD_ID),
    }
    validateConfigTableContent(configs);
    
    return configs;
  } catch (e) {
    addMessageAndThrow(e, 'error during extraction of configuration table');
  } finally {
    if (queryResult && queryResult.isDataLoaded) queryResult.unloadData();
  }
};

const checkEmptyRecords = (records) => {
  const hasEmptyRecord = records.find(record =>
    (record.debitorName === ' ') &&
    !(record.debitorIBAN) &&
    !(record.debitorBIC) &&
    !(record.RUM) &&
    !(record.mandateSignatureDate)) ;
  if (hasEmptyRecord) throwValidationError('Erreur dans la table COLOCATAIRES: au moins une ligne est vide.');
};

const validateRoommatesTableContent = (data) => {
  const errors = [];
  if (!isValidName(data.debitorName)) errors.push('le nom du débiteur doit contenir au maximum 70 caractères,');
  if (!isValidIBAN(data.debitorIBAN)) errors.push('l\'IBAN est invalide,');
  if (!isValidBIC(data.debitorBIC)) errors.push('le BIC est invalide,');
  if (!isValidRUM(data.debitorRUM)) errors.push('le RUM est invalide,');
  if (!isValidDate(data.mandateSignatureDate)) errors.push('la date de signature de mandat est invalide,');

  if (errors.length) {
    throwValidationError(['Erreur(s) dans la table COLOCATAIRES:', ...errors].join(' '));
  }
};

export const getRoommatesData = async () => {
  let queryResult;
  try {
    const roommatesTable = base.getTable(ROOMMATES_TABLE_ID);
    queryResult = await roommatesTable.selectRecordsAsync();

    const roommatesData = queryResult.records.map(record => ({
      debitorName: record.getCellValue(ROOMMATE_NAME_FIELD_ID),
      debitorIBAN: record.getCellValue(ROOMMATE_IBAN_FIELD_ID),
      debitorRUM: record.getCellValue(ROOMMATE_RUM_FIELD_ID),
      debitorBIC: record.getCellValue(ROOMMATE_BIC_FIELD_ID),
      mandateSignatureDate: record.getCellValue(MANDATE_SIGNATURE_DATE_FIELD_ID),
    }));

    checkEmptyRecords(roommatesData);
    await Promise.all(roommatesData.map(record => validateRoommatesTableContent(record)));

    return roommatesData;
  } catch (e) {
    addMessageAndThrow(e, 'error during extraction of roommates table');
  } finally {
    if (queryResult && queryResult.isDataLoaded) queryResult.unloadData();
  }
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
        [HISTORY_DATE_FIELD_ID]: dayjs().format('YYYY-MM-DD'),
      }
    }))

    await addRecords(table, records);
  } catch (e) {
    addMessageAndThrow(e, 'error during history transactions saving');
  }
};


export const addRecords = async (table, data) => {
  try {
    const recordsBatches = chunk(data, BATCH_SIZE);
    await Promise.all(recordsBatches.map((records: typeof data) => table.createRecordsAsync(records)));
  } catch (e) {
    addMessageAndThrow(e, 'error during records creation');
  }
};
