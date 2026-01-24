import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "../idl/voting_system.json";
import { showToast } from "./toast.js";


// Create global variables
const PROGRAM_ID = new PublicKey(idl.address);
const CLUSTER_URL = "http://127.0.0.1:8899"

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
createPollBtn.addEventListener('click', async function () {
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
  } catch (err) {
    showToast("Failed to create poll", 'error');
    console.log("Failed to create poll.", err);
  }
})
