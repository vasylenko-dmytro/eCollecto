import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import '../styles/index.css';
import App from './App'
import { ReduxProvider } from './providers/ReduxProvider';
import { AuthProvider } from './providers/AuthProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReduxProvider>
      <AuthProvider>
        <App/>
      </AuthProvider>
    </ReduxProvider>
  </StrictMode>,
)
