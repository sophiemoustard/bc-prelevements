import { downloadXML } from './files'
import { getDateForFileName } from './dates';


export const createXMLDocument = () => ({
  Document: {
    '@xmlns': 'urn:iso:std:iso:20022:tech:xsd:pain.008.001.02',
    '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    '@xsi:schemaLocation': 'urn:iso:std:iso:20022:tech:xsd:pain.008.001.02 pain.008.001.02.xsd',
    CstmrDrctDbtInitn: {
      GrpHdr: {},
      PmtInf: [],
    },
  },
});

export const generateSEPAHeader = (data = {}) => ({
  MsgId: 'MSG123456789G',
  CreDtTm: '2022-01-20',
  NbOfTxs: 32,
  CtrlSum: 11,
  InitgPty: {
    Nm: 'Alenvi',
    Id: { OrgId: { Othr: { Id: '23453ASA' } } },
  },
});

export const downloadSEPAXml = () => {
  const xmlContent = createXMLDocument();

  xmlContent.Document.CstmrDrctDbtInitn.GrpHdr = generateSEPAHeader();

  const filename = `prelevements_biens_communs_${getDateForFileName()}.xml`;
  return downloadXML(xmlContent, filename)
}
