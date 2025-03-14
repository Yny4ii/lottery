import { useState } from "react"
import { ethers } from "ethers"
import toast from "react-hot-toast"
export const useWallet = () => {
  const [account, setAccount] = useState(null)
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask")
      return
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const accounts = await provider.send("eth_requestAccounts", [])
      setAccount(accounts[0])
    } catch (error) {
      console.error(error)
      toast.error("Failed to connect wallet")
    }
  }
  return { account, connectWallet }
}
