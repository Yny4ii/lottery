import { useCallback, useEffect, useState } from "react"
import { ethers } from "ethers"
import toast from "react-hot-toast"
import { contractAbi } from "../abi/contractAbi"
import { usdtAbi } from "../abi/usdtAbi"

const LOTTERY_CONTRACT = "0xe104D4444D65DA9F87153F1455956B2b2BdB31E2"
const USDT_CONTRACT = "0xc2bc86ee3c524a5cd4550393de9e350f79ec596c"

export const useLottery = (account: string | null) => {
  const [roundId, setRoundId] = useState<number | null>(null)
  const [ticketPrice, setTicketPrice] = useState<string | null>(null)
  const [isFinished, setIsFinished] = useState<boolean | null>(null)
  const [ticketTransactions, setTicketTransactions] = useState<any[]>([])

  useEffect(() => {
    fetchRoundInfo()
  }, [])

  useEffect(() => {
    if (!account) {
      setTicketTransactions([])
    }
  }, [account])

  useEffect(() => {
    if (account) fetchTicketTransactions()
  }, [account])

  const fetchRoundInfo = async () => {
    if (!window.ethereum) return
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const contract = new ethers.Contract(LOTTERY_CONTRACT, contractAbi, provider)

    const latestId = await contract.latestRoundId()
    const round = await contract.rounds(latestId)

    setRoundId(latestId.toNumber())
    setTicketPrice(ethers.utils.formatUnits(round.ticketPrice, 18))
    setIsFinished(round.isFinished)
  }

  const fetchTicketTransactions = useCallback(async () => {
    if (!account) return
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    if (!provider) return

    try {
      const lotteryContract = new ethers.Contract(LOTTERY_CONTRACT, contractAbi, provider)
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

  const buyTicket = async () => {
    if (!window.ethereum || !roundId || !ticketPrice || !account) return
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()

      const usdtContract = new ethers.Contract(USDT_CONTRACT, usdtAbi, signer)
      const lotteryContract = new ethers.Contract(LOTTERY_CONTRACT, contractAbi, signer)

      const amount = ethers.utils.parseUnits(ticketPrice, 18)
      const approveTx = await usdtContract.approve(LOTTERY_CONTRACT, amount)
      await approveTx.wait()

      const tx = await lotteryContract.buyTicket(roundId)
      await tx.wait()
      toast.success("Ticket purchased!")
      await fetchTicketTransactions()
    } catch (error) {
      console.error(error)
      toast.error("Failed to buy ticket")
    }
  }

  return { roundId, ticketPrice, isFinished, ticketTransactions, buyTicket }
}
