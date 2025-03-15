import { useState } from "react"
import { ethers } from "ethers"
import toast from "react-hot-toast"

const BASE_SEPOLIA_CHAIN_ID = "0x14A34"

export const useWallet = () => {
  const [account, setAccount] = useState<string | null>(null)

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask")
      return
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const accounts = await provider.send("eth_requestAccounts", [])
      setAccount(accounts[0])
      await switchToBaseSepolia()
    } catch (error) {
      console.error(error)
      toast.error("Failed to connect wallet")
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    toast.success("Wallet disconnected")
  }

  const switchToBaseSepolia = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BASE_SEPOLIA_CHAIN_ID }],
      })
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: BASE_SEPOLIA_CHAIN_ID,
                chainName: "Base Sepolia Testnet",
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://sepolia.base.org"],
                blockExplorerUrls: ["https://sepolia.basescan.org/"],
              },
            ],
          })
        } catch (addError) {
          toast.error("Failed to add network")
          console.error(addError)
        }
      } else {
        console.error(error)
      }
    }
  }

  return { account, connectWallet, disconnectWallet }
}
