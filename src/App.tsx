import React from "react"
import "./App.css"
import { useWallet } from "./hooks/useWallet"
import { useBalance } from "./hooks/useBalance"
import { useLottery } from "./hooks/useLottery"
import { Toaster } from "react-hot-toast"

export default function LotteryApp() {
  const { account, connectWallet, disconnectWallet } = useWallet()
  const { balance, mintTokens } = useBalance(account)
  const { roundId, ticketPrice, isFinished, ticketTransactions, buyTicket } =
    useLottery(account)

  return (
    <div className="wrapper">
      <h2>Lottery</h2>
      {!account ? (
        <button onClick={connectWallet}>Connect MetaMask</button>
      ) : (
        <>
          <p>Connected: {account}</p>
          <button onClick={disconnectWallet}>Disconnect Wallet</button>
          <p>Balance: {balance !== null ? `${balance} USDTFAKE` : "Loading..."}</p>
          <button onClick={mintTokens}>Mint 10 USDTFAKE</button>
        </>
      )}

      {roundId !== null && ticketPrice ? (
        <>
          <p>Current Round: {roundId}</p>
          <p>Ticket Price: {ticketPrice} USDTFAKE</p>
          <p>Status: {isFinished ? "Finished" : "Active"}</p>
          <button onClick={buyTicket} disabled={!!isFinished || !account}>
            Buy Ticket
          </button>
        </>
      ) : (
        <p>Loading...</p>
      )}
      <h3>
        Ticket Transactions:
        {ticketTransactions.length}
      </h3>
      <ul>
        {ticketTransactions.map((tx, index) => (
          <li key={index}>
            Round {tx.roundId}: {tx.player} bought {tx.amount} tickets
          </li>
        ))}
      </ul>
      <Toaster />
    </div>
  )
}
