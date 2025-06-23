import { useState, useEffect, useRef } from 'react';
import { createThirdwebClient } from "thirdweb";
import { 
  useConnect, 
  useDisconnect, 
  useActiveAccount, 
  useSwitchActiveWalletChain 
} from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import './App.css';

const client = createThirdwebClient({
  clientId: "4849acc8ab094549702f7a44d8e4265d",
});

const networks = {
  1: { 
    name: 'Ethereum Mainnet', 
    coin: 'ETH', 
    hexChainId: '0x1',
    params: {
      chainId: '0x1',
      chainName: 'Ethereum Mainnet',
      nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://mainnet.infura.io/v3/'],
      blockExplorerUrls: ['https://etherscan.io']
    }
  },
  137: { 
    name: 'Polygon Mainnet', 
    coin: 'MATIC', 
    hexChainId: '0x89',
    params: {
      chainId: '0x89',
      chainName: 'Polygon Mainnet',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      rpcUrls: ['https://polygon-rpc.com/'],
      blockExplorerUrls: ['https://polygonscan.com']
    }
  },
  56: { 
    name: 'BNB Smart Chain', 
    coin: 'BNB', 
    hexChainId: '0x38',
    params: {
      chainId: '0x38',
      chainName: 'BNB Smart Chain',
      nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
      rpcUrls: ['https://bsc-dataseed.binance.org/'],
      blockExplorerUrls: ['https://bscscan.com']
    }
  },
  97: { 
    name: 'BNB Testnet', 
    coin: 'BNB', 
    hexChainId: '0x61',
    params: {
      chainId: '0x61',
      chainName: 'BNB Testnet',
      nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
      rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
      blockExplorerUrls: ['https://testnet.bscscan.com']
    }
  },
  43114: { 
    name: 'Avalanche C-Chain', 
    coin: 'AVAX', 
    hexChainId: '0xa86a',
    params: {
      chainId: '0xa86a',
      chainName: 'Avalanche C-Chain',
      nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
      rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
      blockExplorerUrls: ['https://snowtrace.io']
    }
  },
}

function App() {
  const { connect, isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const account = useActiveAccount();
  const { switchChain, isLoading: isSwitchingChain } = useSwitchActiveWalletChain();
  const [selectedNetworkId, setSelectedNetworkId] = useState(1); 
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (account && window.ethereum) {
        try {
          
          const result = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [account.address, 'latest'],
          });
          
       
          const balanceInWei = parseInt(result, 16);
          const balanceInEth = balanceInWei / 1e18;
          
          setBalance({
            displayValue: balanceInEth.toFixed(4),
            symbol: networks[selectedNetworkId].coin
          });
        } catch (error) {
          console.error("Lỗi khi lấy balance:", error);
        }
      } else {
        setBalance(null);
      }
    };
    
    fetchBalance();
    
    
    const intervalId = setInterval(fetchBalance, 10000);
    
    return () => clearInterval(intervalId);
  }, [account, selectedNetworkId]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNetworkDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleConnect = async () => {
    try {
      await connect(async () => {
        const metamask = createWallet("io.metamask");
        await metamask.connect({ client });
        return metamask;
      });
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Disconnect error:", error);
     
      window.localStorage.removeItem("thirdweb:wallet");
      window.location.reload();
    }
  };

  const handleNetworkChange = async (networkId) => {
    setSelectedNetworkId(networkId);
    setShowNetworkDropdown(false);
    
    if (account) {
      try {
        console.log("Switching to chain:", networks[networkId].hexChainId);
      
        if (window.ethereum) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: networks[networkId].hexChainId }],
            });
          } catch (switchError) {
            console.error("Switch error:", switchError);
           
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [networks[networkId].params],
                });
              } catch (addError) {
                console.error("Error adding chain:", addError);
              }
            }
          }
        } else {
         
          await switchChain({ chainId: networks[networkId].hexChainId });
        }
      } catch (error) {
        console.error("Network switch error:", error);
      }
    }
  };

  const toggleNetworkDropdown = () => {
    setShowNetworkDropdown(!showNetworkDropdown);
  };

  return (
    <div className="wallet-container">
      <h1>MetaMask Wallet Connection</h1>
      
      <div className="wallet-info">
        <div className="info-row">
          <div className="info-label">Status:</div>
          <div className="info-value">
            {account ? <span className="connected">Connected</span> : "Not Connected"}
          </div>
        </div>
        
        {account && (
          <>
            <div className="info-row">
              <div className="info-label">Adress:</div>
              <div className="info-value address">{account.address}</div>
            </div>
            
            <div className="info-row">
              <div className="info-label">Balance:</div>
              <div className="info-value">
                {balance ? `${balance.displayValue} ${balance.symbol}` : `0.0 ${networks[selectedNetworkId].coin}`}
              </div>
            </div>
            
            <div className="info-row">
              <div className="info-label">Network:</div>
              <div className="info-value">{networks[selectedNetworkId].name}</div>
            </div>
          </>
        )}
      </div>
      
      {account ? (
        <>
          <div className="network-dropdown-container" ref={dropdownRef}>
            <button 
              className="change-network-button" 
              onClick={toggleNetworkDropdown}
              disabled={isSwitchingChain}
            >
              {isSwitchingChain ? 'Changing Network...' : 'Change Network'}
            </button>
            
            {showNetworkDropdown && (
              <div className="network-dropdown">
                {Object.entries(networks).map(([id, network]) => (
                  <div 
                    key={id} 
                    className="network-option"
                    onClick={() => handleNetworkChange(Number(id))}
                  >
                    {network.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button 
            className="disconnect-button" 
            onClick={handleDisconnect}
          >
            Disconnect
          </button>
        </>
      ) : (
        <button 
          className="connect-button" 
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
}

export default App;

