import { downloadXML } from './files'
import dayjs from './dayjs';
import { getConfig, getRoommatesData } from './airtable';


export const createXMLDocument = () => ({
  Document: {
    '@xmlns': 'urn:iso:std:iso:20022:tech:xsd:pain.008.001.02',
    '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    '@xsi:schemaLocation': 'urn:iso:std:iso:20022:tech:xsd:pain.008.001.02 pain.008.001.02.xsd',
    CstmrDrctDbtInitn: {
      GrpHdr: {},
      PmtInf: [],
    },
    PmtInf: {
      DrctDbtTxInf: [],
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

export const addTransactionInfo = (data) => {
  const obj = { DrctDbtTxInf: [] };

  for (const transaction of data) {
    obj.DrctDbtTxInf.push({
      PmtId: {
        InstrId: transaction.number,
        EndToEndId: transaction._id,
      },
      InstdAmt: {
        '@Ccy': 'EUR',
        '#text': transaction.netInclTaxes,
      },
      DrctDbtTx: {
        MndtRltdInf: {
          MndtId: transaction.rum,
          DtOfSgntr: 'Date de signature',
        },
      },
      DbtrAgt: { FinInstnId: { BIC: transaction.customerInfo.payment.bic } },
      Dbtr: { Nm: transaction.customerInfo.payment.bankAccountOwner.trim() },
      DbtrAcct: { Id: { IBAN: transaction.customerInfo.payment.iban } },
    });
  }

  return obj;
};

export const downloadSEPAXml = async () => {
  const configData = await getConfig();
  const roommatesData = await getRoommatesData();
  const formattedRoommatesData = roommatesData.map(rm => ({
    _id: 'id',
    number: 'REG1234567',
    netInclTaxes: '80',
    rum: rm.debitorRUM,
    customerInfo: { payment: { bic: rm.debitorBIC, bankAccountOwner: rm.debitorName, iban: rm.debitorIBAN } }
  }));
  const xmlContent = createXMLDocument();

  xmlContent.Document.CstmrDrctDbtInitn.GrpHdr = generateSEPAHeader({
    sepaId: 'MSG123456789G',
    createdDate: '2022-01-20',
    transactionsCount: 32,
    totalSum: 11,
    creditorName: configData.creditorName,
    ics: configData.ics,
  });

  xmlContent.Document.PmtInf = addTransactionInfo(formattedRoommatesData);

  const filename = `prelevements_biens_communs_${dayjs().format('YYYY-MM-DD_HH-mm')}.xml`;
  return downloadXML(xmlContent, filename)
}
