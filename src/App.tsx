import React, { useCallback, useEffect, useState } from "react"
import { ethers } from "ethers"
import LOTTERY_ABI from "./abi/LOTTERY_ABI.json"
import "./App.css"
import { useWallet } from "./hooks/useWallet"
import toast, { Toaster } from "react-hot-toast"

const USDT_CONTRACT = "0xc2bc86ee3c524a5cd4550393de9e350f79ec596c"
const LOTTERY_CONTRACT = "0xe104D4444D65DA9F87153F1455956B2b2BdB31E2"

const USDT_ABI = [
  "function mint(address to, uint256 amount) external",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]

export default function LotteryApp() {
  const { account, connectWallet } = useWallet()
  const [minting, setMinting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [roundId, setRoundId] = useState<number | null>(null)
  const [ticketPrice, setTicketPrice] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [isFinished, setIsFinished] = useState<boolean | null>(null)
  const [ticketTransactions, setTicketTransactions] = useState<any[]>([])

  const getProvider = () => {
    if (!window.ethereum) {
      toast.error("MetaMask is not installed")
      return null
    }
    return new ethers.providers.Web3Provider(window.ethereum)
  }

  const fetchRound = useCallback(async () => {
    const provider = getProvider()
    if (!provider) return

    try {
      const contract = new ethers.Contract(LOTTERY_CONTRACT, LOTTERY_ABI, provider)
      const latestId = await contract.latestRoundId()
      const round = await contract.rounds(latestId)

      setRoundId(latestId.toNumber())
      setTicketPrice(ethers.utils.formatUnits(round.ticketPrice, 18))
      setIsFinished(round.isFinished)
    } catch (error) {
      console.error("Failed to fetch round:", error)
      toast.error("Error fetching round data")
    }
  }, [])

  const fetchBalance = useCallback(async () => {
    if (!account) return
    const provider = getProvider()
    if (!provider) return

    try {
      const usdtContract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, provider)
      const balance = await usdtContract.balanceOf(account)
      setBalance(ethers.utils.formatUnits(balance, 18))
    } catch (error) {
      console.error("Failed to fetch balance:", error)
      toast.error("Error fetching balance")
    }
  }, [account])

  const fetchTicketTransactions = useCallback(async () => {
    if (!account) return
    const provider = getProvider()
    if (!provider) return

    try {
      const lotteryContract = new ethers.Contract(LOTTERY_CONTRACT, LOTTERY_ABI, provider)
      const filter = lotteryContract.filters.TicketPurchased(null, account)
      const events = await lotteryContract.queryFilter(filter, -1000)

      setTicketTransactions(
        events.map((event) => ({
          roundId: event.args?.roundId.toString(),
          player: event.args?.player,
          amount: event.args?.amount.toString(),
        }))
      )
    } catch (error) {
      console.error("Failed to fetch ticket transactions:", error)
      toast.error("Error fetching ticket transactions")
    }
  }, [account])

  useEffect(() => {
    fetchRound()
  }, [fetchRound])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance, minting, loading])

  useEffect(() => {
    fetchTicketTransactions()
  }, [fetchTicketTransactions])

  const buyTicket = async () => {
    if (!account || roundId === null) {
      toast.error("Please connect MetaMask")
      return
    }

    setLoading(true)
    try {
      const provider = getProvider()
      if (!provider) return

      const signer = provider.getSigner()
      const usdtContract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, signer)
      const lotteryContract = new ethers.Contract(LOTTERY_CONTRACT, LOTTERY_ABI, signer)
      const amount = ethers.utils.parseUnits(ticketPrice || "0", 18)

      const approveTx = await usdtContract.approve(LOTTERY_CONTRACT, amount)
      await approveTx.wait()

      const tx = await lotteryContract.buyTicket(roundId)
      await tx.wait()

      toast.success("Ticket purchased successfully!")
      fetchBalance()
      fetchTicketTransactions()
    } catch (error) {
      console.error("Failed to buy ticket:", error)
      toast.error("Error purchasing ticket")
    } finally {
      setLoading(false)
    }
  }

  const mintTokens = async () => {
    if (!account) {
      toast.error("Please connect MetaMask")
      return
    }

    setMinting(true)
    try {
      const provider = getProvider()
      if (!provider) return

      const signer = provider.getSigner()
      const usdtContract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, signer)
      const amount = ethers.utils.parseUnits("10", 18)

      const tx = await usdtContract.mint(account, amount)
      await tx.wait()

      toast.success("10 USDTFAKE minted successfully!")
      fetchBalance()
    } catch (error) {
      console.error("Minting failed:", error)
      toast.error("Minting failed")
    } finally {
      setMinting(false)
    }
  }
  return (
    <div className="wrapper">
      <h2>Lottery</h2>
      <button onClick={connectWallet}>
        {account ? `Connected: ${account}` : "Connect MetaMask"}
      </button>
      <p>Balance: {balance !== null ? `${balance} USDTFAKE` : "Loading..."}</p>
      <button onClick={mintTokens} disabled={minting}>
        {minting ? "Minting..." : "Mint 10 USDTFAKE"}
      </button>
      {roundId !== null && ticketPrice ? (
        <>
          <p>Current Round: {roundId}</p>
          <p>Ticket Price: {ticketPrice} USDTFAKE</p>
          <p>Status: {isFinished ? "Finished" : "Active"}</p>
          <button onClick={buyTicket} disabled={loading || !!isFinished}>
            {loading ? "Purchasing..." : "Buy Ticket"}
          </button>
        </>
      ) : (
        <p>Loading...</p>
      )}
      <h3>Ticket Transactions</h3>
      <ul>
        {ticketTransactions.length > 0 ? (
          ticketTransactions.map((tx, index) => (
            <li key={index}>
              Round {tx.roundId}: {tx.player} bought {tx.amount} tickets
            </li>
          ))
        ) : (
          <p>No transactions found</p>
        )}
      </ul>
      <Toaster />
    </div>
  )
}
