import { useState } from "react"
import { ethers } from "ethers"
export const useWallet = () => {
  const [account, setAccount] = useState(null)
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask")
      return
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const accounts = await provider.send("eth_requestAccounts", [])
      setAccount(accounts[0])
    } catch (error) {
      console.error(error)
      alert("Failed to connect wallet")
    }
  }
  return { account, connectWallet }
}
