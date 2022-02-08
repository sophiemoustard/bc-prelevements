import { useRecords, useBase } from '@airtable/blocks/ui';


export const useTableContent = (tableId: string) => {
  const base = useBase();
  const table = base.getTableById(tableId);
  const records = useRecords(table);
  const { fields } = table;

  return records.map(
    r => fields.reduce(
      (acc, field) => ({ ...acc, [field.name]: r.getCellValue(field) }),
      {}
    )
  );
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
