import { downloadXML } from './files'
import dayjs from './dayjs';
import ObjectID from 'bson-objectid';
import { addRecord, getConfigData, getHistories, getRoommatesData, getTableFieldsIdsAndLabel } from './airtable';
import { addMessageAndThrow } from './errors';
import { AMOUNTS_NATURE, CURRENT_EXPENSES, RENT, RENTAL_EXPENSES } from './constants';
import { HISTORY_AMOUNT_FIELD_ID, HISTORY_DATE_FIELD_ID, HISTORY_DEBITOR_NAME_FIELD_ID, HISTORY_IBAN_FIELD_ID, HISTORY_RUM_FIELD_ID, HISTORY_TABLE, HISTORY_TRANSACTION_ID_FIELD_ID, HISTORY_TRANSACTION_NUMBER_FIELD_ID, HISTORY_TYPE_FIELD_ID } from '../../.env/models';


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

export const formatTransactionNumber = (companyPrefixNumber, prefix, transactionNumber) => {
  return `REG-${companyPrefixNumber}${prefix}${transactionNumber.toString().padStart(5, '0')}`;
};

const getLabel = (fields, fieldId) => fields.find(field => field.id === fieldId).name || '';

export const getTransactionsHistoryForCurrentMonthAndRUMs = async (date) => {
  try {
    let transactionMonthNumber = 1;
    let RUMs = [];

    const histories = await getHistories();

    transactionMonthNumber = histories.map(h => h.date).filter(hdate => dayjs(hdate).isSame(date, 'month')).length
    RUMs = [...new Set(histories.map(h => h.RUM))];

    return { transactionMonthNumber, RUMs };
  } catch (e) {
    addMessageAndThrow(e, 'error during extraction of history table');
  }
};

export const formatTransactions = async (configData, roommatesData, amounts) => {
  try {
    const rentTransactions = [];
    const rentalExpenseTransactions = [];
    const currentExpenseTransations = [];
    const allTransactions = [];
    let transactionNumber;

    const historyTableFieldsLabel = getTableFieldsIdsAndLabel(HISTORY_TABLE);

    const natures = [
      {label: configData.rentTransactionLabel, value: RENT },
      {label: configData.rentalExpensesLabel, value: RENTAL_EXPENSES },
      {label: configData.currentExpensesLabel, value: CURRENT_EXPENSES },
    ];
    const date = dayjs().toISOString();
    const prefixDate = dayjs(date).format('MMYY');
    let { transactionMonthNumber } = await getTransactionsHistoryForCurrentMonthAndRUMs(date);

    for (const roommate of roommatesData) {
      for (const nature of AMOUNTS_NATURE) {
        transactionNumber = formatTransactionNumber(configData.creditorPrefix, prefixDate, transactionMonthNumber);
        const historyData = {
          [getLabel(historyTableFieldsLabel, HISTORY_DEBITOR_NAME_FIELD_ID)]: roommate.debitorName,
          [getLabel(historyTableFieldsLabel, HISTORY_TRANSACTION_NUMBER_FIELD_ID)]: transactionNumber,
          [getLabel(historyTableFieldsLabel, HISTORY_TRANSACTION_ID_FIELD_ID)]: ObjectID().toHexString(),
          [getLabel(historyTableFieldsLabel, HISTORY_AMOUNT_FIELD_ID)]: amounts[nature],
          [getLabel(historyTableFieldsLabel, HISTORY_RUM_FIELD_ID)]: roommate.debitorRUM,
          [getLabel(historyTableFieldsLabel, HISTORY_IBAN_FIELD_ID)]: roommate.debitorIBAN,
          [getLabel(historyTableFieldsLabel, HISTORY_DATE_FIELD_ID)]: date,
          [getLabel(historyTableFieldsLabel, HISTORY_TYPE_FIELD_ID)]: natures.find(item => item.value === nature).label,
        };

        if (nature === RENT) rentTransactions.push(historyData);
        else if (nature === RENTAL_EXPENSES) rentalExpenseTransactions.push(historyData);
        else currentExpenseTransations.push(historyData);
        allTransactions.push(historyData);

        transactionMonthNumber += 1;
      }
    }

    return { rentTransactions, rentalExpenseTransactions, currentExpenseTransations, allTransactions };
  } catch (e) {
    addMessageAndThrow(e, 'error during creation of history table');
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

    allTransactions.forEach(transaction => addRecord(HISTORY_TABLE, transaction));
  
    const filename = `prelevements_biens_communs_${dayjs().format('YYYY-MM-DD_HH-mm')}.xml`;
    return downloadXML(xmlContent, filename);
  } catch (e) {
    addMessageAndThrow(e, 'error during generation of sepa file');
  }
};
