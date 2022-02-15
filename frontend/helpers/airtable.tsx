import { base } from '@airtable/blocks';
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
} from '../../.env/models';

export const getConfig = async () => {
  const configTable = base.getTable(CONFIG_TABLE_ID);
  const queryResult = configTable.selectRecords();
  await queryResult.loadDataAsync();
  const configRecord = queryResult.records[0];

  const configs = {
    creditorName: configRecord.getCellValue(CREDITOR_NAME_FIELD_ID),
    ics: configRecord.getCellValue(ICS_FIELD_ID),
    creditorIBAN: configRecord.getCellValue(CREDITOR_IBAN_FIELD_ID),
    creditorBIC: configRecord.getCellValue(CREDITOR_BIC_FIELD_ID),
    creditorPrefix: configRecord.getCellValue(CREDITOR_PREFIX_FIELD_ID),
  }
    
  queryResult.unloadData();
  return configs;
}

export const getRoommatesData = async () => {
  const roommatesTable = base.getTable(ROOMMATES_TABLE_ID);
  const queryResult = await roommatesTable.selectRecordsAsync();
  const roommatesData = [];

  for (const record of queryResult.records) {
    const roommateData = {
      debitorName: record.getCellValue(ROOMMATE_FIELD_ID),
      debitorIBAN: record.getCellValue(IBAN_FIELD_ID),
      debitorRUM: record.getCellValue(RUM_FIELD_ID),
      debitorBIC: record.getCellValue(BIC_FIELD_ID),
    };
    roommatesData.push(roommateData);
  }
  
  return roommatesData;
};
