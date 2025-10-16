import React, { useState } from 'react';
import Home from './components/Home';
import Dashboard from './components/Dashboard';


function App() {
const [started, setStarted] = useState(false);


return (
<div>
{started ? <Dashboard /> : <Home onStart={() => setStarted(true)} />}
</div>
);
}


export default App;