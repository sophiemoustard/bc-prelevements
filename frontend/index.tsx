import { initializeBlock, Button } from '@airtable/blocks/ui';
import React, { useState } from 'react';
import NiInput from './components/form/input';
import { downloadSEPAXml } from './helpers/sepa';

const App = () => {
  const [amounts, setAmounts] = useState({ rent: 1, rentalExpenses: 1, currentExpenses: 1 });

  const enableDownload = amounts.rent > 0 && amounts.rentalExpenses > 0 && amounts.currentExpenses > 0;

  const setAmountField = (key) => (e) => { setAmounts({ ...amounts, [key]: e.target.value }); };
  return (
    <>
      <NiInput value={amounts.rent} onChange={setAmountField('rent')} label="Montant Loyer" type='number' required/>
      <NiInput value={amounts.rentalExpenses} onChange={setAmountField('rentalExpenses')} type='number'
          label="Montant Charges locatives" required/>
      <NiInput value={amounts.currentExpenses} onChange={setAmountField('currentExpenses')} type='number'
          label="Montant Frais courants" required/>
      <Button onClick={downloadSEPAXml} icon="edit" disabled={!enableDownload}>Telecharger Le SEPA</Button>
    </>
  );
}

initializeBlock(() => <App />);
