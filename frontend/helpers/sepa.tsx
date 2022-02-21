import { downloadXML } from './files'
import dayjs from './dayjs';
import ObjectID from 'bson-objectid';
import {
  addRecords,
  getConfigData,
  getTransactionsHistoryData,
  getRoommatesData,
} from './airtable';
import { addMessageAndThrow } from './errors';
import {
  AMOUNTS_NATURE,
  CURRENT_EXPENSES,
  RENT,
  RENTAL_EXPENSES,
  HISTORY_AMOUNT_FIELD_ID,
  HISTORY_DATE_FIELD_ID,
  HISTORY_DEBITOR_NAME_FIELD_ID,
  HISTORY_IBAN_FIELD_ID,
  HISTORY_RUM_FIELD_ID,
  HISTORY_TRANSACTION_ID_FIELD_ID,
  HISTORY_TRANSACTION_NUMBER_FIELD_ID,
  HISTORY_TYPE_FIELD_ID,
  HISTORY_TABLE_ID,
} from '../data/constants';


export const createXMLDocument = () => ({
  Document: {
    '@xmlns': 'urn:iso:std:iso:20022:tech:xsd:pain.008.001.02',
    '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    '@xsi:schemaLocation': 'urn:iso:std:iso:20022:tech:xsd:pain.008.001.02 pain.008.001.02.xsd',
    CstmrDrctDbtInitn: {
      GrpHdr: {},
      PmtInf: {
        DrctDbtTxInf: [],
      },
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

const addTransactionInfo = (data) => {
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

const formatTransactionNumber = (companyPrefixNumber, prefix, transactionNumber) => {
  return `REG-${companyPrefixNumber}${prefix}${transactionNumber.toString().padStart(5, '0')}`;
};

const getTransactionsHistoryForCurrentMonthAndRUMs = async (date) => {
  try {
    const histories = await getTransactionsHistoryData();

    const transactionMonthCount = histories.filter(h => dayjs(h.date).isSame(date, 'month')).length || 0;
    const RUMs = [...new Set(histories.map(h => h.RUM))];

    return { transactionMonthCount, RUMs };
  } catch (e) {
    addMessageAndThrow(e, 'error during extraction of history table');
  }
};

const formatHistoryData = (roommate, transactionNumber, amounts, date, labels, label) => ({
  [HISTORY_DEBITOR_NAME_FIELD_ID]: roommate.debitorName,
  [HISTORY_TRANSACTION_NUMBER_FIELD_ID]: transactionNumber,
  [HISTORY_TRANSACTION_ID_FIELD_ID]: ObjectID().toHexString(),
  [HISTORY_AMOUNT_FIELD_ID]: amounts[label],
  [HISTORY_RUM_FIELD_ID]: roommate.debitorRUM,
  [HISTORY_IBAN_FIELD_ID]: roommate.debitorIBAN,
  [HISTORY_DATE_FIELD_ID]: date,
  [HISTORY_TYPE_FIELD_ID]: labels.find(item => item.value === label).label,
});

const formatTransactions = async (configData, roommatesData, amounts) => {
  try {
    const rentTransactions = [];
    const rentalExpenseTransactions = [];
    const currentExpenseTransations = [];
    const allTransactions = [];
    const transactionsLabel = [
      {label: configData.rentTransactionLabel, value: RENT },
      {label: configData.rentalExpensesLabel, value: RENTAL_EXPENSES },
      {label: configData.currentExpensesLabel, value: CURRENT_EXPENSES },
    ];
    const date = dayjs().toISOString();
    const prefixDate = dayjs(date).format('MMYY');

    let { transactionMonthCount } = await getTransactionsHistoryForCurrentMonthAndRUMs(date);

    for (const roommate of roommatesData) {
      for (const nature of AMOUNTS_NATURE) {
        transactionMonthCount += 1;

        const transactionNumber = formatTransactionNumber(configData.creditorPrefix, prefixDate, transactionMonthCount);
        const historyData = formatHistoryData(roommate, transactionNumber, amounts, date, transactionsLabel, nature);

        if (nature === RENT) rentTransactions.push(historyData);
        else if (nature === RENTAL_EXPENSES) rentalExpenseTransactions.push(historyData);
        else currentExpenseTransations.push(historyData);
        allTransactions.push({ fields: historyData });
      }
    }

    return { rentTransactions, rentalExpenseTransactions, currentExpenseTransations, allTransactions };
  } catch (e) {
    addMessageAndThrow(e, 'error when formatting transaction data');
  }
};

export const downloadSEPAXml = async (amounts) => {
  try {
    const configData = await getConfigData();
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

    xmlContent.Document.CstmrDrctDbtInitn.PmtInf = addTransactionInfo(formattedRoommatesData);

    const { allTransactions } = await formatTransactions(configData, roommatesData, amounts);

    await addRecords(HISTORY_TABLE_ID, allTransactions);
  
    const filename = `prelevements_biens_communs_${dayjs().format('YYYY-MM-DD_HH-mm')}.xml`;
    return downloadXML(xmlContent, filename);
  } catch (e) {
    addMessageAndThrow(e, 'error during generation of sepa file');
  }
};
