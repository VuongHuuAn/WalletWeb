import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThirdwebProvider } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";

const clientId = "4849acc8ab094549702f7a44d8e4265d";
const client = createThirdwebClient({ clientId });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThirdwebProvider client={client}>
      <App />
    </ThirdwebProvider>
  </React.StrictMode>,
)
