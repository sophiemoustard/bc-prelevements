import { downloadXML } from './files'
import { getDateForFileName } from './dates';
import { getConfig } from './airtable';


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

export const generateSEPAHeader = (data) => ({
  MsgId: data.sepaId,
  CreDtTm: data.createdDate,
  NbOfTxs: data.transactionsCount,
  CtrlSum: data.totalSum,
  InitgPty: {
    Nm: data.creditorName,
    Id: { OrgId: { Othr: { Id: data.ics } } },
  },
});

export const downloadSEPAXml = async () => {
  const configData = await getConfig();
  const xmlContent = createXMLDocument();

  xmlContent.Document.CstmrDrctDbtInitn.GrpHdr = generateSEPAHeader({
    sepaId: 'MSG123456789G',
    createdDate: '2022-01-20',
    transactionsCount: 32,
    totalSum: 11,
    creditorName: configData.creditorName,
    ics: configData.ics,
  });

  const filename = `prelevements_biens_communs_${getDateForFileName()}.xml`;
  return downloadXML(xmlContent, filename)
}
