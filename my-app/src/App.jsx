import { useState, useEffect } from 'react';
import {
  ThirdwebProvider,
  useConnect,
  useActiveAccount,
  useSwitchChain,
  useWalletBalance,
  useDisconnect
} from "thirdweb/react";
import { metamaskWallet } from "thirdweb/wallets";
import { createThirdwebClient } from "thirdweb";
import './App.css';

const client = createThirdwebClient({
  clientId: "c01fd3d1a6295cddb2d5b37b6eea7e19",
});

const networks = {
  1: { name: 'Ethereum Mainnet', coin: 'ETH', hexChainId: '0x1' },
  137: { name: 'Polygon Mainnet', coin: 'MATIC', hexChainId: '0x89' },
  56: { name: 'BNB Smart Chain', coin: 'BNB', hexChainId: '0x38' },
  97: { name: 'BNB Testnet', coin: 'BNB', hexChainId: '0x61' },
  43114: { name: 'Avalanche C-Chain', coin: 'AVAX', hexChainId: '0xa86a' },
}

function WalletConnect() {
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const account = useActiveAccount();
  const { switchChain } = useSwitchChain();
  const balanceQuery = useWalletBalance();
  const [networkInfo, setNetworkInfo] = useState({});
  
  useEffect(() => {
    if (account) {
      const chainId = account.chainId;
      setNetworkInfo(networks[chainId] || { name: `Chain ID: ${chainId}`, coin: '?' });
    }
  }, [account]);

  const handleConnectWallet = async () => {
    try {
      await connect(metamaskWallet());
    } catch (error) {
      console.error("Lỗi kết nối:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Lỗi ngắt kết nối:", error);
    }
  };

  const handleSwitchChain = async (chainId) => {
    try {
      await switchChain(chainId);
    } catch (error) {
      console.error("Lỗi chuyển mạng:", error);
    }
  };

  if (!account) {
    return (
      <div className="wallet-container">
        <h1>MetaMask Wallet Connection</h1>
        <button onClick={handleConnectWallet} className="connect-button">
          Kết nối MetaMask
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-container">
      <h1>MetaMask Wallet Connection</h1>
      
      <div className="wallet-info">
        <div className="info-row">
          <div className="info-label">Status:</div>
          <div className="info-value connected">Connected</div>
        </div>
        
        <div className="info-row">
          <div className="info-label">Adress:</div>
          <div className="info-value address">{account.address}</div>
        </div>
        
        <div className="info-row">
          <div className="info-label">Balance:</div>
          <div className="info-value">
            {balanceQuery.data 
              ? `${parseFloat(balanceQuery.data.displayValue).toFixed(1)} ${balanceQuery.data.symbol}`
              : `0.0 ${networkInfo.coin || 'ETH'}`}
          </div>
        </div>
        
        <div className="info-row">
          <div className="info-label">Network:</div>
          <div className="info-value">
            {networkInfo.name} {account.chainId && `(Chain ID: ${account.chainId})`}
          </div>
        </div>
      </div>
      
      <button 
        className="change-network-button"
        onClick={() => {
          const networkSelect = document.getElementById("network-select");
          handleSwitchChain(Number(networkSelect.value));
        }}
      >
        Change Network
      </button>
      
      <select id="network-select" className="network-select">
        {Object.entries(networks).map(([chainId, info]) => (
          <option key={chainId} value={chainId}>
            {info.name} ({info.coin})
          </option>
        ))}
      </select>
      
      <button onClick={handleDisconnect} className="disconnect-button">
        Disconnect
      </button>
    </div>
  );
}

function App() {
  return (
    <ThirdwebProvider clientId="c01fd3d1a6295cddb2d5b37b6eea7e19">
      <WalletConnect />
    </ThirdwebProvider>
  );
}

export default App;