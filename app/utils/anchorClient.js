import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "../idl/voting_system.json";
import { showToast } from "./toast.js";


// Create global variables
const PROGRAM_ID = new PublicKey(idl.address);
const CLUSTER_URL = "https://api.devnet.solana.com";

let program = null;
let provider = null;
let publicKey = null;

// DOM element references
const connectWalletBtn = document.querySelector("#connect-wallet");
const createPollBtn = document.querySelector("#submit");

// Establish wallet Connection
connectWalletBtn.addEventListener('click', async function () {
  if (!window.solana) {
    showToast("Wallet not detected", "error");
    console.log("Wallet not detected.");
    return;
  }

  try {
    // Request connection from wallet.
    const response = await window.solana.connect();
    publicKey = response.publicKey;

    // Initialize Solana connection
    const connection = new Connection(CLUSTER_URL, "confirmed");

    // Create anchor provider
    provider = new anchor.AnchorProvider(connection, window.solana, { preflightCommitment: "confirmed" });

    // Create program instance
    program = new anchor.Program(idl, provider);

    console.log("Connected to wallet successfully.")
  } catch (err) {
    showToast("Failed to connect to wallet", "error");
    console.log("Wallet connection failed: ", err);
  }
})

// Create poll 
createPollBtn.addEventListener('click', async function (event) {
  event.preventDefault();

  if (!program || !publicKey) {
    showToast("Error in program/public key", "error");
    console.log("Error in program/public key.");
    return;
  }

  try {
    const pollId = new anchor.BN(Math.floor(Math.random() * 9000000) + 1000000);
    const description = document.getElementById('poll-description').value;
    const options = Array.from(document.querySelectorAll('.option-input'))
      .map(input => ({
        description: input.value,
        votes: new anchor.BN(0),
      }));


    const txn = await program.methods
      .createPoll(pollId, description, options)
      .accounts({
        payer: publicKey,
      })
      .rpc();

    document.getElementById('poll-form').reset();

    showToast("Poll has been successfully created", 'success');
    console.log("Poll has been successfully created.");

    // Dispatch event to notify that a new poll was created
    window.dispatchEvent(new CustomEvent('pollCreated'));
  } catch (err) {
    showToast("Failed to create poll", 'error');
    console.log("Failed to create poll.", err);
  }
})


// Initialize vote 
export async function vote(pollPubKeyStr, optionIndex) {
  if (!program || !publicKey) {
    showToast("Error in program/public key", "error");
    console.log("Error in program/public key.");
    return false;
  }

  try {
    const pollPubKey = new PublicKey(pollPubKeyStr);

    const txn = await program.methods
      .initializeVote(optionIndex)
      .accounts({
        payer: publicKey,
        poll: pollPubKey,
      })
      .rpc();

    showToast("Vote has been successfully submitted", 'success');
    console.log("Vote has been successfully submitted.");
    return true;
  } catch (err) {
    if (err.error?.errorCode?.code === "AccountNotInitialized" ||
      err.logs?.some(log => log.includes("already in use"))
    ) {
      showToast("You have already voted on this poll", 'error');
    } else {
      showToast("Failed to submit vote", 'error');
    }

    console.log("Vote failed: ", err);
    return false;
  }
}


// ===============================================================
// Helper Functions

// Fetch all active polls
export async function fetchActivePolls() {
  if (!program) {
    return [];
  }

  try {
    const allPolls = await program.account.poll.all();
    return allPolls.filter(poll => poll.account.status === true);
  } catch (err) {
    console.error("Failed to fetch polls:", err);
    return [];
  }
}

// Check if wallet is connected
export function isWalletConnected() {
  return program !== null && publicKey !== null;
}
