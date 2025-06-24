import { useState, useEffect, useRef } from 'react';
import { createThirdwebClient } from "thirdweb";
import { 
  useConnect, 
  useDisconnect, 
  useActiveAccount, 
  useSwitchActiveWalletChain,
  useWalletBalance,
  ChainProvider,
  ChainIcon,
  ChainName
} from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import { defineChain, ethereum, polygon, bsc, bscTestnet, avalanche } from "thirdweb/chains";
import './App.css';

const client = createThirdwebClient({
  clientId: "4849acc8ab094549702f7a44d8e4265d",
});


const networks = [
  { id: 1, chainId: "0x1", chain: ethereum, name: "Ethereum", coin: "ETH" },
  { id: 137, chainId: "0x89", chain: polygon, name: "Polygon", coin: "MATIC" },
  { id: 56, chainId: "0x38", chain: bsc, name: "BNB Smart Chain", coin: "BNB" },
  { id: 97, chainId: "0x61", chain: bscTestnet, name: "BNB Testnet", coin: "BNB" },
  { id: 43114, chainId: "0xa86a", chain: avalanche, name: "Avalanche C-Chain", coin: "AVAX" }
];


const getChainById = (chainId) => {
  const network = networks.find(net => net.id === Number(chainId));
  return network?.chain || ethereum;
};


const getCoinByChainId = (chainId) => {
  const network = networks.find(net => net.id === Number(chainId));
  return network?.coin || "ETH";
};

function App() {
  const { connect, isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const account = useActiveAccount();
  const { switchChain, isLoading: isSwitchingChain } = useSwitchActiveWalletChain();
  const [selectedNetworkId, setSelectedNetworkId] = useState(1); 
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  const { data: balance, isLoading: isBalanceLoading } = useWalletBalance({
    address: account?.address,
    chain: getChainById(selectedNetworkId),
    client: client
  });

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

  useEffect(() => {
    const reconnectWallet = async () => {
      const savedWallet = localStorage.getItem("wallet");
      if (savedWallet === "metamask") {
        try {
          await connect(async () => {
            const metamask = createWallet("io.metamask");
            await metamask.connect({ client });
            return metamask;
          });
        } catch (error) {
          console.error("Auto reconnect error:", error);
          localStorage.removeItem("wallet");
        }
      }
    };
    
    reconnectWallet();
  }, [connect]);

  const handleConnect = async () => {
    try {
      await connect(async () => {
        const metamask = createWallet("io.metamask");
        await metamask.connect({ client });
        localStorage.setItem("wallet", "metamask");
        return metamask;
      });
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      localStorage.removeItem("wallet");
    } catch (error) {
      console.error("Disconnect error:", error);
      localStorage.removeItem("wallet");
      window.localStorage.removeItem("thirdweb:wallet");
      window.location.reload();
    }
  };

  const handleNetworkChange = async (networkId) => {
    setSelectedNetworkId(networkId);
    setShowNetworkDropdown(false);
    
    if (account) {
      try {
        const network = networks.find(net => net.id === networkId);
        console.log("Switching to chain:", network.chainId);
      
        if (window.ethereum) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: network.chainId }],
            });
          } catch (switchError) {
            console.error("Switch error:", switchError);
           
            if (switchError.code === 4902) {
              try {
                
                const selectedChain = getChainById(networkId);
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: network.chainId,
                    chainName: selectedChain.name,
                    nativeCurrency: selectedChain.nativeCurrency,
                    rpcUrls: [selectedChain.rpc],
                    blockExplorerUrls: [selectedChain.explorers?.[0]?.url || ""]
                  }],
                });
              } catch (addError) {
                console.error("Error adding chain:", addError);
              }
            }
          }
        } else {
          await switchChain({ chainId: network.chainId });
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
                {isBalanceLoading ? (
                  "Đang tải..."
                ) : balance ? (
                  `${parseFloat(balance.displayValue).toFixed(4)} ${balance.symbol}`
                ) : (
                  `0.0 ${getCoinByChainId(selectedNetworkId)}`
                )}
              </div>
            </div>
            
            <div className="info-row">
              <div className="info-label">Network:</div>
              <div className="info-value">
                <ChainProvider chain={getChainById(selectedNetworkId)}>
                  <div className="network-info">
                    <ChainIcon /> <ChainName />
                  </div>
                </ChainProvider>
              </div>
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
                {networks.map((network) => (
                  <div 
                    key={network.id} 
                    className={`network-option ${network.id === selectedNetworkId ? 'selected' : ''}`}
                    onClick={() => handleNetworkChange(network.id)}
                  >
                    <ChainProvider chain={network.chain}>
                      <ChainIcon /> <ChainName />
                    </ChainProvider>
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

