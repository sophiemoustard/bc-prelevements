import { base } from '@airtable/blocks';
import { devModelsId, prodModelsId, PROD_BASE_ID } from '../../.env/models'


/*
 ************************************************* CONSTANTS **********************************************************
 */
export const INTERNAL_ERROR_MESSAGE = 'Une erreur interne s\'est produite, veuillez contacter l\'équipe technique.';
export const VALIDATION_ERROR = 'Validation error';
export const RENT = 'rent';
export const RENTAL_EXPENSES = 'rentalExpenses';
export const CURRENT_EXPENSES = 'currentExpenses';
export const AMOUNTS_NATURE = [RENT, RENTAL_EXPENSES, CURRENT_EXPENSES];
export const BATCH_SIZE = 50;


/*
 ************************************************* MODEL IDS ********************************************************** 
 */

const modelsId = base.id === PROD_BASE_ID ? prodModelsId : devModelsId;

// ROOM MATES TABLE
export const ROOMMATES_TABLE_ID = modelsId.roommatesTableId;
export const ROOMMATE_FIELD_ID = modelsId.roommateFieldId;
export const LASTNAME_FIELD_ID = modelsId.lastNameFieldId;
export const FIRSTNAME_FIELD_ID = modelsId.firstNameFieldId;
export const IBAN_FIELD_ID = modelsId.ibanFieldId;
export const BIC_FIELD_ID = modelsId.bicFieldId;
export const RUM_FIELD_ID = modelsId.rumFieldId;
export const DATE_FIELD_ID = modelsId.dateFieldId;


// CONFIG TABLE
export const CONFIG_TABLE_ID = modelsId.configTableId;
export const CREDITOR_NAME_FIELD_ID = modelsId.creditorNameFieldId;
export const ICS_FIELD_ID = modelsId.icsFieldId;
export const CREDITOR_IBAN_FIELD_ID = modelsId.creditorIbanFieldId;
export const CREDITOR_BIC_FIELD_ID = modelsId.creditorBicFieldId;
export const CREDITOR_PREFIX_FIELD_ID = modelsId.creditorPrefixFieldId;
export const RENT_FIELD_ID = modelsId.rentFieldId;
export const RENTAL_EXPENSES_FIELD_ID = modelsId.rentalExpensesFieldId;
export const CURRENT_EXPENSES_FIELD_ID = modelsId.currentExpensesFieldId;

// // TRANSACTION HISTORY TABLE
export const HISTORY_TABLE_ID = modelsId.historyTableId;
export const HISTORY_DEBITOR_NAME_FIELD_ID = modelsId.historyDebitorNameFieldId;
export const HISTORY_TRANSACTION_NUMBER_FIELD_ID = modelsId.historyTransactionNumberFieldId;
export const HISTORY_TRANSACTION_ID_FIELD_ID = modelsId.historyTransactionIdFieldId;
export const HISTORY_AMOUNT_FIELD_ID = modelsId.historyAmountFieldId;
export const HISTORY_RUM_FIELD_ID = modelsId.historyRUMFieldId;
export const HISTORY_IBAN_FIELD_ID = modelsId.historyIBANFieldId;
export const HISTORY_DATE_FIELD_ID = modelsId.historyDateFieldId;
export const HISTORY_TYPE_FIELD_ID = modelsId.historyTypeFieldId;

