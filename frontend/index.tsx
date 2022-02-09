import { initializeBlock, Button } from '@airtable/blocks/ui';
import React, { useState } from 'react';
import NiInput from './components/form/input';
import { downloadCsv } from './helpers/files';
import { downloadSEPAXml } from './helpers/sepa';
import { getDateForFileName } from './helpers/dates';
import { useTableContentAsCsv } from './helpers/airtable';
import { ROOM_MATES_TABLE_ID } from '../.env/models';

const App = () => {
    const [amounts, setAmounts] = useState({ rent: 0, rentalExpenses: 0, currentExpenses: 0 });
    const dataCsv = useTableContentAsCsv(ROOM_MATES_TABLE_ID);

    const downloadCSV = () => {      
        const filename = `prelevements_biens_communs_${getDateForFileName()}.csv`;
        return downloadCsv(dataCsv, filename);
    };

    const enableDownload = amounts.rent > 0 && amounts.rentalExpenses > 0 && amounts.currentExpenses > 0;


    const setAmountField = (key) => (e) => { setAmounts({ ...amounts, [key]: e.target.value }); };
    return <div>
        <NiInput value={amounts.rent} onChange={setAmountField('rent')} label="Montant Loyer" required/>
        <NiInput value={amounts.rentalExpenses} onChange={setAmountField('rentalExpenses')} 
            label="Montant Charges locatives" required/>
        <NiInput value={amounts.currentExpenses} onChange={setAmountField('currentExpenses')}
            label="Montant Frais courants" required/>
        <Button onClick={downloadCSV} icon="edit" disabled={!enableDownload}>Telecharger le CSV</Button>
        <Button onClick={downloadSEPAXml} icon="edit" disabled={!enableDownload}>Telecharger Le SEPA</Button>
    </div>;
}

initializeBlock(() => <App />);
