import {createRoot} from 'react-dom/client';
import App from './App';

// Pages and the downloaded HTML always start in the local guided workspace.
createRoot(document.getElementById('root')!).render(<App/>);
