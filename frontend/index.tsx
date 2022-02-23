import { initializeBlock, Button, Text, colors } from '@airtable/blocks/ui';
import React, { useState, useReducer } from 'react';
import NiInput from './components/form/input';
import { downloadSEPAXml } from './helpers/sepa';
import { errorReducer, initialErrorState, SET_ERROR, RESET_ERROR } from './reducers/error';
import { INTERNAL_ERROR_MESSAGE, VALIDATION_ERROR } from './data/constants'

const App = () => {
  const [amounts, setAmounts] = useState({ rent: 1, rentalExpenses: 1, currentExpenses: 1 });
  const [error, dispatchError] = useReducer(errorReducer, initialErrorState);

  const enableDownload = amounts.rent > 0 && amounts.rentalExpenses > 0 && amounts.currentExpenses > 0;

  const download = async () => {
    dispatchError({ type: RESET_ERROR });
    try {
      await downloadSEPAXml(amounts);
    } catch (e) {
      console.error(e);
      if (e.name === VALIDATION_ERROR) dispatchError({ type: SET_ERROR, payload: e.message });
      else dispatchError({ type: SET_ERROR, payload: INTERNAL_ERROR_MESSAGE });
    }
  };

  const setAmountField = (key) => (e) => { setAmounts({ ...amounts, [key]: e.target.value }); };
  const formatAmountField = (key) => (e) => {
    setAmounts({ ...amounts, [key]: parseFloat(Number(e.target.value).toFixed(2)) });
  };

  return (
    <>
      <NiInput value={amounts.rent} onChange={setAmountField('rent')} label="Montant Loyer" type='number' 
        onBlur={formatAmountField('rent')} required />
      <NiInput value={amounts.rentalExpenses} onChange={setAmountField('rentalExpenses')} type='number'
        onBlur={formatAmountField('rentalExpenses')} label="Montant Charges locatives" required />
      <NiInput value={amounts.currentExpenses} onChange={setAmountField('currentExpenses')} type='number'
        onBlur={formatAmountField('currentExpenses')} label="Montant Frais courants" required />
      <Button onClick={download} icon="edit" disabled={!enableDownload}>Telecharger Le SEPA</Button>
      {error.value && <Text style={style.error}>{error.message}</Text>}
    </>
  );
}

const style = {
  error: {
    color: colors.RED,
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 16,
  }
};

initializeBlock(() => <App />);
