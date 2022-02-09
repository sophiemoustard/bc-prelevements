import builder from 'xmlbuilder';

export const downloadFile = (file, fileName, type = '') => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([file.data], { type }));
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


export const downloadCsv = (data, fileName) => {
  let csvContent = '\ufeff'; // UTF16LE BOM for Microsoft Excel
  data.forEach((rowArray) => {
    const row = rowArray.join(';');
    csvContent += `${row}\r\n`;
  });

  return downloadFile({ data: csvContent }, fileName);
};

export const downloadXML = (xmlContent, fileName) => {
  const finalDoc = builder.create(xmlContent, { encoding: 'utf-8' });

  return downloadFile({ data: finalDoc.end({ pretty: true }) }, fileName);
};
