import { initializeBlock, Button, Text, colors, Loader } from '@airtable/blocks/ui';
import React, { useState, useReducer } from 'react';
import NiInput from './components/form/input';
import { downloadSEPAXml } from './helpers/sepa';
import { errorReducer, initialErrorState, SET_ERROR, RESET_ERROR } from './reducers/error';
import { INTERNAL_ERROR_MESSAGE, VALIDATION_ERROR } from './data/constants'
import { throwValidationError } from './helpers/errors';

const App = () => {
  const [inputAmounts, setInputAmounts] = useState({ rent: "0", rentalExpenses: "0", currentExpenses: "0" });
  const [loading, setLoading] = useState(false);
  const [error, dispatchError] = useReducer(errorReducer, initialErrorState);

  const download = async () => {
    setLoading(true);
    dispatchError({ type: RESET_ERROR });
    try {
      const numbersAmount = {
        rent: Number(inputAmounts.rent),
        rentalExpenses: Number(inputAmounts.rentalExpenses),
        currentExpenses: Number(inputAmounts.currentExpenses)
      }

      const areValidAmounts = numbersAmount.rent > 0 && numbersAmount.rentalExpenses > 0 && 
        numbersAmount.currentExpenses > 0;
      if (!areValidAmounts) throw throwValidationError('Erreur, les montants doivent être strictement positifs.');

      await downloadSEPAXml(numbersAmount);
    } catch (e) {
      console.error(e);
      if (e.name === VALIDATION_ERROR) dispatchError({ type: SET_ERROR, payload: e.message });
      else dispatchError({ type: SET_ERROR, payload: INTERNAL_ERROR_MESSAGE });
    } finally {
      setLoading(false);
    }
  };

  const setAmountField = (key) => (e) => { setInputAmounts({ ...inputAmounts, [key]: e.target.value }); };
  const formatAmountField = (key) => (e) => {
    const amountWithExactlyTwoDecimal = Number(e.target.value).toFixed(2);
    const amount = parseFloat(amountWithExactlyTwoDecimal).toString()

    setInputAmounts({ ...inputAmounts, [key]: amount });
  };

  return (
    <>
      <NiInput value={inputAmounts.rent} onChange={setAmountField('rent')} label="Montant Loyer" type='number' required
        onBlur={formatAmountField('rent')} />
      <NiInput value={inputAmounts.rentalExpenses} onChange={setAmountField('rentalExpenses')} type='number' required
        onBlur={formatAmountField('rentalExpenses')} label="Montant Charges locatives" />
      <NiInput value={inputAmounts.currentExpenses} onChange={setAmountField('currentExpenses')} type='number' required
        onBlur={formatAmountField('currentExpenses')} label="Montant Frais courants" />
      <Button disabled={loading} onClick={download} icon="download">Telecharger le SEPA</Button>
      {loading && <Loader />}
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
