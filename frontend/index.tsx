import { initializeBlock, Text } from '@airtable/blocks/ui';
import React from 'react';

const App = () => {
    return <Text>Bonjour Monde</Text>
}

initializeBlock(() => <App />);
