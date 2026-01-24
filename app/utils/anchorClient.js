import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "../idl/voting_system.json";
import { showToast } from "../app.js";



// Create global variables
const PROGRAM_ID = new PublicKey(idl.address);
const CLUSTER_URL = "http://127.0.0.1:8899"

let program = null;
let provider = null;
let publicKey = null;

// DOM element references
const connectWalletBtn = document.querySelector("#connect-wallet");
const addOptionBtn = document.querySelector("#add-option");
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
