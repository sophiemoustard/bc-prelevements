import { useRecords, useBase } from '@airtable/blocks/ui';
import { base } from '@airtable/blocks';
import {
  CONFIG_TABLE_ID,
  CREDITOR_NAME_FIELD_ID,
  ICS_FIELD_ID,
  CREDITOR_IBAN_FIELD_ID,
  CREDITOR_BIC_FIELD_ID,
  CREDITOR_PREFIX_FIELD_ID,
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

export const useTableContentAsCsv = (tableId: string) => {
  const base = useBase();
  const table = base.getTableById(tableId);
  const records = useRecords(table);
  const { fields } = table;

  return [
    fields.map(field => field.name),
    ...records.map(record => fields.reduce(
      (acc, field) => [ ...acc, record.getCellValue(field) ],
      []
    ))
  ];
};
