import { initializeBlock, Button, Text, Loader } from '@airtable/blocks/ui';
import React, { useEffect, useState } from 'react';
import NiInput from './components/form/input';
import { downloadSEPAXml } from './helpers/sepa';

const App = () => {
    const [amounts, setAmounts] = useState({ rent: 1, rentalExpenses: 1, currentExpenses: 1 });

    const enableDownload = amounts.rent > 0 && amounts.rentalExpenses > 0 && amounts.currentExpenses > 0;

    const setAmountField = (key) => (e) => { setAmounts({ ...amounts, [key]: e.target.value }); };
    return <div>
        <NiInput value={amounts.rent} onChange={setAmountField('rent')} label="Montant Loyer" required/>
        <NiInput value={amounts.rentalExpenses} onChange={setAmountField('rentalExpenses')} 
            label="Montant Charges locatives" required/>
        <NiInput value={amounts.currentExpenses} onChange={setAmountField('currentExpenses')}
            label="Montant Frais courants" required/>
        <Button onClick={downloadSEPAXml} icon="edit" disabled={!enableDownload}>Telecharger Le SEPA</Button>
    </div>;
}

initializeBlock(() => <App />);
