import { useState, useEffect } from "react"
import { ethers } from "ethers"
import toast from "react-hot-toast"

const USDT_CONTRACT = "0xc2bc86ee3c524a5cd4550393de9e350f79ec596c"
const USDT_ABI = [
  "function mint(address to, uint256 amount) external",
  "function balanceOf(address account) view returns (uint256)",
]

export const useBalance = (account: string | null) => {
  const [balance, setBalance] = useState<string | null>(null)

  useEffect(() => {
    if (account) fetchBalance()
  }, [account])

  const fetchBalance = async () => {
    if (!window.ethereum || !account) return
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const contract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, provider)
    const balance = await contract.balanceOf(account)
    setBalance(ethers.utils.formatUnits(balance, 18))
  }

  const mintTokens = async () => {
    if (!window.ethereum || !account) return
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, signer)
      const amount = ethers.utils.parseUnits("10", 18)

      const tx = await contract.mint(account, amount)
      await tx.wait()
      toast.success("10 USDTFAKE minted!")
      fetchBalance()
    } catch (error) {
      console.error(error)
      toast.error("Minting failed")
    }
  }

  return { balance, mintTokens }
}
