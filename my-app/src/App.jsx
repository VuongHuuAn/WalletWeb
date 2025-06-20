import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [account, setAccount] = useState('')
  const [balance, setBalance] = useState('')
  const [chainId, setChainId] = useState('')
  const [networkName, setNetworkName] = useState('')
  const [coinName, setCoinName] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [provider, setProvider] = useState(null)
  const [isNetworkMenuOpen, setIsNetworkMenuOpen] = useState(false)
  const [switchingNetwork, setSwitchingNetwork] = useState(false)
  
  const networks = {
    1: { name: 'Ethereum Mainnet', coin: 'ETH', hexChainId: '0x1' },
    137: { name: 'Polygon Mainnet', coin: 'MATIC', hexChainId: '0x89' },
    56: { name: 'BNB Smart Chain', coin: 'BNB', hexChainId: '0x38' },
    97: { name: 'BNB Testnet', coin: 'BNB', hexChainId: '0x61' },
    43114: { name: 'Avalanche C-Chain', coin: 'AVAX', hexChainId: '0xa86a' },
  }

  useEffect(() => {
    const checkIfWalletIsConnected = async () => {
      try {
        if (!window.ethereum) {
          console.log("Hãy cài đặt MetaMask!")
          return
        }

        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        
        if (accounts.length !== 0) {
          const account = accounts[0]
          setAccount(account)
          await updateWalletInfo(account)
          setIsConnected(true)
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra MetaMask:", error)
      }
    }

    checkIfWalletIsConnected()

    if (window.ethereum) {
      window.ethereum.on('chainChanged', (chainId) => {
       
        checkIfWalletIsConnected()
      })
      
      window.ethereum.on('accountsChanged', (accounts) => {
       
        if (accounts.length === 0) {
           
          resetWalletInfo()
        } else {
          checkIfWalletIsConnected()
        }
      })
    }

    return () => {
       
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', () => {})
        window.ethereum.removeListener('accountsChanged', () => {})
      }
    }
  }, [])

  const updateWalletInfo = async (account) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      setProvider(provider)
      
      const balance = await provider.getBalance(account)
      const formattedBalance = ethers.utils.formatEther(balance)
      setBalance(formattedBalance)
      
      const network = await provider.getNetwork()
      const chainIdDecimal = network.chainId
      setChainId(chainIdDecimal)

       
      if (networks[chainIdDecimal]) {
        setNetworkName(networks[chainIdDecimal].name)
        setCoinName(networks[chainIdDecimal].coin)
      } else {
        setNetworkName('Unknown Network')
        setCoinName('???')
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin ví:", error)
    }
  }

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Hãy cài đặt MetaMask!")
        return
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const account = accounts[0]
      
      setAccount(account)
      await updateWalletInfo(account)
      setIsConnected(true)
    } catch (error) {
      console.error("Lỗi khi kết nối với MetaMask:", error)
    }
  }

  const disconnectWallet = () => {
    resetWalletInfo()
  }

  const resetWalletInfo = () => {
    setAccount('')
    setBalance('')
    setChainId('')
    setNetworkName('')
    setCoinName('')
    setIsConnected(false)
    setProvider(null)
  }

  const switchNetwork = async (newChainId, hexChainId) => {
    if (!window.ethereum) return
    
    try {
      setSwitchingNetwork(true)
      
      // Thử chuyển đổi sang mạng
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }]
      })
      
      // Nếu thành công, cập nhật thông tin
      await updateWalletInfo(account)
    } catch (error) {
      // Nếu mạng chưa được thêm vào MetaMask
      if (error.code === 4902) {
        try {
          // Thêm mạng mới
          const networkConfig = getNetworkConfig(newChainId)
          if (networkConfig) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [networkConfig]
            })
          }
        } catch (addError) {
          console.error("Lỗi khi thêm mạng:", addError)
        }
      } else {
        console.error("Lỗi khi chuyển mạng:", error)
      }
    } finally {
      setSwitchingNetwork(false)
      setIsNetworkMenuOpen(false)
    }
  }

  
  const getNetworkConfig = (chainId) => {
    switch (parseInt(chainId)) {
      case 1:
        return {
          chainId: '0x1',
          chainName: 'Ethereum Mainnet',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://mainnet.infura.io/v3/'],
          blockExplorerUrls: ['https://etherscan.io']
        }
      case 137:
        return {
          chainId: '0x89',
          chainName: 'Polygon Mainnet',
          nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
          rpcUrls: ['https://polygon-rpc.com/'],
          blockExplorerUrls: ['https://polygonscan.com/']
        }
      case 56:
        return {
          chainId: '0x38',
          chainName: 'BNB Smart Chain',
          nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
          rpcUrls: ['https://bsc-dataseed.binance.org/'],
          blockExplorerUrls: ['https://bscscan.com/']
        }
      case 97:
        return {
          chainId: '0x61',
          chainName: 'BNB Testnet',
          nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
          rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
          blockExplorerUrls: ['https://testnet.bscscan.com/']
        }
      case 43114:
        return {
          chainId: '0xa86a',
          chainName: 'Avalanche C-Chain',
          nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
          rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
          blockExplorerUrls: ['https://snowtrace.io/']
        }
      default:
        return null
    }
  }

  const toggleNetworkMenu = () => {
    setIsNetworkMenuOpen(!isNetworkMenuOpen)
  }

  return (
    <div className="wallet-container">
      <h1>MetaMask Wallet Connection</h1>
      
      {!isConnected ? (
        <button className="connect-button" onClick={connectWallet}>
          Kết nối với MetaMask
        </button>
      ) : (
        <div className="wallet-info">
          <div className="info-item">
            <span className="info-label">Status:</span>
            <span className="info-value connected">Connected</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Adress:</span>
            <span className="info-value">{account}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Balance:</span>
            <span className="info-value">{balance} {coinName}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Network:</span>
            <span className="info-value">{networkName} (Chain ID: {chainId})</span>
          </div>

          <div className="network-selector">
            <button 
              className="network-dropdown-button" 
              onClick={toggleNetworkMenu}
              disabled={switchingNetwork}
            >
              {switchingNetwork ? 'Đang chuyển mạng...' : 'Change Network'}
            </button>
            
            {isNetworkMenuOpen && (
              <div className="network-dropdown-menu">
                {Object.entries(networks).map(([id, network]) => (
                  <div 
                    key={id} 
                    className={`network-option ${parseInt(id) === chainId ? 'active' : ''}`}
                    onClick={() => switchNetwork(id, network.hexChainId)}
                  >
                    <span>{network.name}</span>
                    <span className="network-coin">{network.coin}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="disconnect-button" onClick={disconnectWallet}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}

export default App
