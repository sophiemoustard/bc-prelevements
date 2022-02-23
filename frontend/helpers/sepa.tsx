import { downloadXML } from './files'
import dayjs from './dayjs';
import ObjectID from 'bson-objectid';
import {
  getConfigData,
  getTransactionsHistoryData,
  getRoommatesData,
  createTransactionsHistoryRecords
} from './airtable';
import { addMessageAndThrow } from './errors';
import { getFixedNumber, removeSpaces } from './utils'
import randomize from 'randomatic';


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

const generateSEPAHeader = (data) => ({
  MsgId: data.sepaId,
  CreDtTm: data.createdDate,
  NbOfTxs: data.transactionsCount,
  CtrlSum: data.totalSum,
  InitgPty: {
    Nm: data.creditorName,
    Id: { OrgId: { Othr: { Id: data.ics } } },
  },
});

const generatePaymentInfo = data => ({
  PmtInfId: data.id,
  PmtMtd: data.method,
  NbOfTxs: data.txNumber,
  CtrlSum: getFixedNumber(data.sum, 2),
  PmtTpInf: {
    SvcLvl: { Cd: 'SEPA' },
    LclInstrm: { Cd: 'CORE' },
    SeqTp: data.sequenceType,
  },
  ReqdColltnDt: data.collectionDate,
  Cdtr: { Nm: data.creditorName },
  CdtrAcct: {
    Id: { IBAN: removeSpaces(data.creditorIBAN) },
    Ccy: 'EUR',
  },
  CdtrAgt: { FinInstnId: { BIC: removeSpaces(data.creditorBIC) } },
  ChrgBr: 'SLEV',
  CdtrSchmeId: {
    Id: {
      PrvtId: {
        Othr: {
          Id: removeSpaces(data.ics),
          SchmeNm: { Prtry: 'SEPA' },
        },
      },
    },
  },
  DrctDbtTxInf: [],
});

const generateTransactionsInfo = (transactions) => transactions.map(transaction => ({
  PmtId: {
    InstrId: transaction.number,
    EndToEndId: transaction.id,
  },
  InstdAmt: {
    '@Ccy': 'EUR',
    '#text': transaction.amount,
  },
  DrctDbtTx: {
    MndtRltdInf: {
      MndtId: transaction.debitorRUM,
    },
  },
  DbtrAgt: { FinInstnId: { BIC: removeSpaces(transaction.debitorBIC) } },
  Dbtr: { Nm: transaction.debitorName.trim() },
  DbtrAcct: { Id: { IBAN: removeSpaces(transaction.debitorIBAN) } },
  RmtInf: { Ustrd: transaction.expenseLabel }
}));

const formatTransactionNumber = (companyPrefixNumber, prefix, transactionNumber) => {
  return `REG-${companyPrefixNumber}${prefix}${transactionNumber.toString().padStart(5, '0')}`;
};

const generateTransactionsForOnePayment = (data) => {
  const prefixDate = dayjs().format('MMYY');

  return data.roommatesData.map((roommate, index) => ({
    id: ObjectID().toHexString(),
    number: formatTransactionNumber(data.creditorPrefix, prefixDate, data.transactionMonthCount + index + 1),
    amount: data.amount,
    expenseLabel: data.expenseLabel,
    debitorName : roommate.debitorName,
    debitorIBAN : roommate.debitorIBAN,
    debitorBIC : roommate.debitorBIC,
    debitorRUM: roommate.debitorRUM,
  }))
};

const generateTransactions = (amounts, roommatesData, configData, transactionsHistoryData) => {
  const transactionMonthCount = transactionsHistoryData.filter(h => dayjs().isSame(h.date, 'month')).length || 0;

  const transactionsRent = generateTransactionsForOnePayment({
    roommatesData,
    amount: amounts.rent,
    expenseLabel: configData.rentLabel,
    transactionMonthCount,
    creditorPrefix: configData.creditorPrefix
  });
  const transactionsRentalExpenses = generateTransactionsForOnePayment({
    roommatesData,
    amount: amounts.rentalExpenses,
    expenseLabel: configData.rentalExpensesLabel,
    transactionMonthCount: transactionMonthCount + transactionsRent.length,
    creditorPrefix: configData.creditorPrefix
  });
  const transactionsCurrentExpenses = generateTransactionsForOnePayment({
    roommatesData,
    amount: amounts.currentExpenses,
    expenseLabel: configData.currentExpensesLabel,
    transactionMonthCount: transactionMonthCount + transactionsRent.length + transactionsRentalExpenses.length,
    creditorPrefix: configData.creditorPrefix
  });

  return { transactionsRent, transactionsRentalExpenses, transactionsCurrentExpenses };
};

export const downloadSEPAXml = async (amounts) => {
  try {
    const configData = await getConfigData();
    const roommatesData = await getRoommatesData();
    const transactionsHistoryData = await getTransactionsHistoryData();
    const randomId = randomize('0', 21);

    
    const {
      transactionsRent,
      transactionsRentalExpenses,
      transactionsCurrentExpenses
    } = generateTransactions(amounts, roommatesData, configData, transactionsHistoryData);
    const allTransactions = [...transactionsRent, ...transactionsRentalExpenses, ...transactionsCurrentExpenses];
    
    const rentTotalAmount = transactionsRent.reduce((acc, next) => acc + next.amount, 0);
    const rentalExpensesTotalAmount = transactionsRentalExpenses.reduce((acc, next) => acc + next.amount, 0);
    const currentExpensesTotalAmount = transactionsCurrentExpenses.reduce((acc, next) => acc + next.amount, 0);
    
    let rentPaymentInfo;
    if (transactionsRent.length) {
      rentPaymentInfo = generatePaymentInfo({
        id: `MSG0LYER${randomId}R`,
        sequenceType: 'RCUR',
        method: 'DD',
        txNumber: transactionsRent.length,
        sum: rentTotalAmount,
        collectionDate: dayjs().format('YYYY-MM-DD'),
        creditorName: configData.creditorName,
        creditorIBAN: configData.creditorIBAN,
        creditorBIC: configData.creditorBIC,
        ics: configData.ics,
      })
      rentPaymentInfo.DrctDbtTxInf = generateTransactionsInfo(transactionsRent);
    }

    let rentalExpensesPaymentInfo;
    if (transactionsRentalExpenses.length) {
      rentalExpensesPaymentInfo = generatePaymentInfo({
        id: `MSG0CHRG${randomId}R`,
        sequenceType: 'RCUR',
        method: 'DD',
        txNumber: transactionsRentalExpenses.length,
        sum: rentalExpensesTotalAmount,
        collectionDate: dayjs().format('YYYY-MM-DD'),
        creditorName: configData.creditorName,
        creditorIBAN: configData.creditorIBAN,
        creditorBIC: configData.creditorBIC,
        ics: configData.ics,
      })
      rentalExpensesPaymentInfo.DrctDbtTxInf = generateTransactionsInfo(transactionsRentalExpenses);
    }

    let currentExpensesPaymentInfo;
    if (transactionsCurrentExpenses.length) {
      currentExpensesPaymentInfo = generatePaymentInfo({
        id: `MSG0PROV${randomId}R`,
        sequenceType: 'RCUR',
        method: 'DD',
        txNumber: transactionsCurrentExpenses.length,
        sum: currentExpensesTotalAmount,
        collectionDate: dayjs().format('YYYY-MM-DD'),
        creditorName: configData.creditorName,
        creditorIBAN: configData.creditorIBAN,
        creditorBIC: configData.creditorBIC,
        ics: configData.ics,
      })
      currentExpensesPaymentInfo.DrctDbtTxInf = generateTransactionsInfo(transactionsCurrentExpenses);
    }
    
    
    const xmlContent = createXMLDocument();
    xmlContent.Document.CstmrDrctDbtInitn.GrpHdr = generateSEPAHeader({
      sepaId: `MSG00000${randomId}G`,
      createdDate: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
      transactionsCount: allTransactions.length,
      totalSum: rentTotalAmount + rentalExpensesTotalAmount + currentExpensesTotalAmount,
      creditorName: configData.creditorName,
      ics: configData.ics,
    });
    xmlContent.Document.CstmrDrctDbtInitn.PmtInf = [
      rentPaymentInfo,
      rentalExpensesPaymentInfo,
      currentExpensesPaymentInfo
    ];

    await createTransactionsHistoryRecords(allTransactions);
  
    const filename = `prelevements_biens_communs_${dayjs().format('YYYY-MM-DD_HH-mm')}.xml`;
    return downloadXML(xmlContent, filename);
  } catch (e) {
    addMessageAndThrow(e, 'error during generation of sepa file');
  }
};
