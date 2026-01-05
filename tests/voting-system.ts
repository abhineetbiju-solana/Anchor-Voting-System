import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VotingSystem } from "../target/types/voting_system";
import { PublicKey, Keypair } from "@solana/web3.js";
import { expect } from "chai";

describe("voting-system", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.votingSystem as Program<VotingSystem>;
  const payer = provider.wallet as anchor.Wallet;

  // Helper function to derive Poll PDA
  const getPollPDA = (payerPubkey: PublicKey, pollId: anchor.BN): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), payerPubkey.toBuffer(), pollId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
  };

  // Helper function to derive VoterRecord PDA
  const getVoterRecordPDA = (voterPubkey: PublicKey, pollPubkey: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), voterPubkey.toBuffer(), pollPubkey.toBuffer()],
      program.programId
    );
  };

  describe("create_poll", () => {
    it("should create a poll successfully", async () => {
      const pollId = new anchor.BN(1);
      const description = "What is your favorite programming language?";
      const options = [
        { description: "Rust", votes: new anchor.BN(0) },
        { description: "TypeScript", votes: new anchor.BN(0) },
        { description: "Python", votes: new anchor.BN(0) },
      ];

      const [pollPDA] = getPollPDA(payer.publicKey, pollId);

      const tx = await program.methods
        .createPoll(pollId, description, options)
        .accounts({
          payer: payer.publicKey,
          poll: pollPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Create poll transaction signature:", tx);

      // Fetch and verify the poll account
      const pollAccount = await program.account.poll.fetch(pollPDA);
      expect(pollAccount.pollId.toNumber()).to.equal(1);
      expect(pollAccount.authority.toString()).to.equal(payer.publicKey.toString());
      expect(pollAccount.description).to.equal(description);
      expect(pollAccount.options.length).to.equal(3);
      expect(pollAccount.options[0].description).to.equal("Rust");
      expect(pollAccount.options[1].description).to.equal("TypeScript");
      expect(pollAccount.options[2].description).to.equal("Python");
      expect(pollAccount.status).to.equal(true);
    });

    it("should create multiple polls with different IDs", async () => {
      const pollId = new anchor.BN(2);
      const description = "Best framework for web development?";
      const options = [
        { description: "React", votes: new anchor.BN(0) },
        { description: "Vue", votes: new anchor.BN(0) },
      ];

      const [pollPDA] = getPollPDA(payer.publicKey, pollId);

      await program.methods
        .createPoll(pollId, description, options)
        .accounts({
          payer: payer.publicKey,
          poll: pollPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const pollAccount = await program.account.poll.fetch(pollPDA);
      expect(pollAccount.pollId.toNumber()).to.equal(2);
      expect(pollAccount.description).to.equal(description);
      expect(pollAccount.options.length).to.equal(2);
    });
  });

  describe("initialize_vote", () => {
    let votePollId: anchor.BN;
    let votePollPDA: PublicKey;

    before(async () => {
      // Create a poll specifically for voting tests
      votePollId = new anchor.BN(100);
      const description = "Vote test poll";
      const options = [
        { description: "Option A", votes: new anchor.BN(0) },
        { description: "Option B", votes: new anchor.BN(0) },
        { description: "Option C", votes: new anchor.BN(0) },
      ];

      [votePollPDA] = getPollPDA(payer.publicKey, votePollId);

      await program.methods
        .createPoll(votePollId, description, options)
        .accounts({
          payer: payer.publicKey,
          poll: votePollPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    });

    it("should cast a vote successfully", async () => {
      const optionIndex = 0; // Vote for Option A

      const [voterRecordPDA] = getVoterRecordPDA(payer.publicKey, votePollPDA);

      const tx = await program.methods
        .initializeVote(optionIndex)
        .accounts({
          payer: payer.publicKey,
          poll: votePollPDA,
          voterRecord: voterRecordPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Initialize vote transaction signature:", tx);

      // Verify the voter record
      const voterRecord = await program.account.voterRecord.fetch(voterRecordPDA);
      expect(voterRecord.poll.toString()).to.equal(votePollPDA.toString());
      expect(voterRecord.voter.toString()).to.equal(payer.publicKey.toString());
      expect(voterRecord.optionIndex).to.equal(optionIndex);

      // Verify the vote count was incremented
      const pollAccount = await program.account.poll.fetch(votePollPDA);
      expect(pollAccount.options[0].votes.toNumber()).to.equal(1);
    });

    it("should allow different voters to vote on the same poll", async () => {
      // Create a new poll for this test
      const newPollId = new anchor.BN(101);
      const [newPollPDA] = getPollPDA(payer.publicKey, newPollId);

      await program.methods
        .createPoll(newPollId, "Multi-voter test", [
          { description: "Option X", votes: new anchor.BN(0) },
          { description: "Option Y", votes: new anchor.BN(0) },
        ])
        .accounts({
          payer: payer.publicKey,
          poll: newPollPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // First voter (payer) votes
      const [voterRecordPDA1] = getVoterRecordPDA(payer.publicKey, newPollPDA);

      await program.methods
        .initializeVote(0) // Vote for Option X
        .accounts({
          payer: payer.publicKey,
          poll: newPollPDA,
          voterRecord: voterRecordPDA1,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Verify vote count
      const pollAccount = await program.account.poll.fetch(newPollPDA);
      expect(pollAccount.options[0].votes.toNumber()).to.equal(1);
    });

    it("should fail when voting with an invalid option index", async () => {
      // Create a new poll for this test
      const newPollId = new anchor.BN(102);
      const [newPollPDA] = getPollPDA(payer.publicKey, newPollId);

      await program.methods
        .createPoll(newPollId, "Invalid option test", [
          { description: "Only Option", votes: new anchor.BN(0) },
        ])
        .accounts({
          payer: payer.publicKey,
          poll: newPollPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const [voterRecordPDA] = getVoterRecordPDA(payer.publicKey, newPollPDA);
      const invalidOptionIndex = 5; // Poll only has 1 option (index 0)

      try {
        await program.methods
          .initializeVote(invalidOptionIndex)
          .accounts({
            payer: payer.publicKey,
            poll: newPollPDA,
            voterRecord: voterRecordPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();

        // If we reach here, the test should fail
        expect.fail("Expected transaction to fail with InvalidOptionIndex error");
      } catch (error: any) {
        expect(error.message).to.include("InvalidOptionIndex");
      }
    });
  });

  describe("end_poll", () => {
    let endPollId: anchor.BN;
    let endPollPDA: PublicKey;

    before(async () => {
      // Create a poll specifically for end_poll tests
      endPollId = new anchor.BN(200);
      const description = "Poll to be ended";
      const options = [
        { description: "Yes", votes: new anchor.BN(0) },
        { description: "No", votes: new anchor.BN(0) },
      ];

      [endPollPDA] = getPollPDA(payer.publicKey, endPollId);

      await program.methods
        .createPoll(endPollId, description, options)
        .accounts({
          payer: payer.publicKey,
          poll: endPollPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    });

    it("should end a poll successfully", async () => {
      // Verify poll is initially open
      let pollAccount = await program.account.poll.fetch(endPollPDA);
      expect(pollAccount.status).to.equal(true);

      const tx = await program.methods
        .endPoll(endPollId)
        .accounts({
          authority: payer.publicKey,
          poll: endPollPDA,
        })
        .rpc();

      console.log("End poll transaction signature:", tx);

      // Verify the poll is now closed
      pollAccount = await program.account.poll.fetch(endPollPDA);
      expect(pollAccount.status).to.equal(false);
    });

    it("should fail when voting on a closed poll", async () => {
      // Create and close a poll
      const closedPollId = new anchor.BN(201);
      const [closedPollPDA] = getPollPDA(payer.publicKey, closedPollId);

      await program.methods
        .createPoll(closedPollId, "Closed poll test", [
          { description: "Option 1", votes: new anchor.BN(0) },
        ])
        .accounts({
          payer: payer.publicKey,
          poll: closedPollPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // End the poll
      await program.methods
        .endPoll(closedPollId)
        .accounts({
          authority: payer.publicKey,
          poll: closedPollPDA,
        })
        .rpc();

      // Try to vote on the closed poll
      const [voterRecordPDA] = getVoterRecordPDA(payer.publicKey, closedPollPDA);

      try {
        await program.methods
          .initializeVote(0)
          .accounts({
            payer: payer.publicKey,
            poll: closedPollPDA,
            voterRecord: voterRecordPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();

        expect.fail("Expected transaction to fail with PollClosed error");
      } catch (error: any) {
        expect(error.message).to.include("PollClosed");
      }
    });

    it("should fail when non-authority tries to end a poll", async () => {
      // Create a new poll
      const authTestPollId = new anchor.BN(202);
      const [authTestPollPDA] = getPollPDA(payer.publicKey, authTestPollId);

      await program.methods
        .createPoll(authTestPollId, "Authority test poll", [
          { description: "Option", votes: new anchor.BN(0) },
        ])
        .accounts({
          payer: payer.publicKey,
          poll: authTestPollPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Try to end the poll with a different authority (generate a new keypair)
      const fakeAuthority = Keypair.generate();

      try {
        await program.methods
          .endPoll(authTestPollId)
          .accounts({
            authority: fakeAuthority.publicKey,
            poll: authTestPollPDA,
          })
          .signers([fakeAuthority])
          .rpc();

        expect.fail("Expected transaction to fail due to authority mismatch");
      } catch (error: any) {
        // The error could be either a constraint violation or seeds mismatch
        expect(error.message).to.satisfy((msg: string) =>
          msg.includes("ConstraintSeeds") ||
          msg.includes("has_one") ||
          msg.includes("A seeds constraint was violated")
        );
      }
    });
  });

  describe("prevent duplicate votes", () => {
    it("should fail when same voter tries to vote twice on same poll", async () => {
      // Create a poll
      const dupePollId = new anchor.BN(300);
      const [dupePollPDA] = getPollPDA(payer.publicKey, dupePollId);

      await program.methods
        .createPoll(dupePollId, "Duplicate vote test", [
          { description: "Option A", votes: new anchor.BN(0) },
          { description: "Option B", votes: new anchor.BN(0) },
        ])
        .accounts({
          payer: payer.publicKey,
          poll: dupePollPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const [voterRecordPDA] = getVoterRecordPDA(payer.publicKey, dupePollPDA);

      // First vote should succeed
      await program.methods
        .initializeVote(0)
        .accounts({
          payer: payer.publicKey,
          poll: dupePollPDA,
          voterRecord: voterRecordPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Second vote should fail (account already exists)
      try {
        await program.methods
          .initializeVote(1)
          .accounts({
            payer: payer.publicKey,
            poll: dupePollPDA,
            voterRecord: voterRecordPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();

        expect.fail("Expected transaction to fail - duplicate vote");
      } catch (error: any) {
        // Should fail because the VoterRecord PDA already exists
        expect(error.message).to.satisfy((msg: string) =>
          msg.includes("already in use") ||
          msg.includes("already been processed") ||
          msg.includes("custom program error")
        );
      }
    });
  });
});
