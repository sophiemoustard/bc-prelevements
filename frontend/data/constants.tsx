import { base } from '@airtable/blocks';
import { envModelsId, prodModelsId, PROD_BASE_ID } from '../../.env/models'


/*
 ************************************************* CONSTANTS **********************************************************
 */
export const INTERNAL_ERROR_MESSAGE = 'Une erreur interne s\'est produite, veuillez contacter l\'équipe technique.';
export const VALIDATION_ERROR = 'Validation error';


/*
 ************************************************* MODEL IDS ********************************************************** 
 */

const modelsId = base.id === PROD_BASE_ID ? prodModelsId : envModelsId;

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
