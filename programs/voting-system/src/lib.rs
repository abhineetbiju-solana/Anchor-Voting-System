use anchor_lang::prelude::*;

declare_id!("83n1rqQHGL8WidFW2LuXkG5dkPLLdB2VNoW8TzXG2JNR");

#[program]
pub mod voting_system {
    use super::*;

    pub fn create_poll(
        ctx: Context<CreatePoll>,
        poll_id: u64,
        description: String,
        options: Vec<Options>,
    ) -> Result<()> {
        let payer = &ctx.accounts.payer;
        let poll = &mut ctx.accounts.poll;

        poll.poll_id = poll_id;
        poll.authority = payer.key();
        poll.description = description;
        poll.options = options;
        poll.status = true;
        msg!("New poll has been created with poll id: {:?}", poll_id);
        Ok(())
    }

    pub fn initialize_vote(ctx: Context<VoteInPoll>, option_index: u8) -> Result<()> {
        let payer = &ctx.accounts.payer;
        let poll = &mut ctx.accounts.poll;
        let voter_record = &mut ctx.accounts.voter_record;

        voter_record.poll = poll.key();
        voter_record.voter = payer.key();
        voter_record.option_index = option_index;

        poll.options[option_index as usize].votes += 1; //incrementing tally record in poll

        msg!("Vote from Pubkey: {:?} has been casted", payer.key());
        Ok(())
    }
}

//==============================================================

// Account Struct: Poll
#[account]
#[derive(InitSpace)]
pub struct Poll {
    pub poll_id: u64,
    pub authority: Pubkey,
    #[max_len(256)]
    pub description: String,
    #[max_len(10)]
    pub options: Vec<Options>,
    pub status: bool,
}
// Account Struct: Options
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct Options {
    #[max_len(64)]
    pub description: String,
    pub votes: u64,
}

// Account Struct: Voter Record (Creates a PDA for each voter to prevent duplicate votes)
#[account]
#[derive(InitSpace)]
pub struct VoterRecord {
    pub poll: Pubkey,     //Pubkey of the poll for which voter has voted
    pub voter: Pubkey,    //Pubkey of the voter
    pub option_index: u8, //Index of the option selected by voter
}

//==============================================================

// Context: Create Poll
#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct CreatePoll<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(init,
        space=8+Poll::INIT_SPACE, payer=payer,
        seeds=[b"poll",payer.key().as_ref(),poll_id.to_le_bytes().as_ref()], bump)]
    pub poll: Account<'info, Poll>,

    pub system_program: Program<'info, System>,
}

// Context: Vote In Poll
#[derive(Accounts)]
pub struct VoteInPoll<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub poll: Account<'info, Poll>,

    #[account(init,
        space=8+VoterRecord::INIT_SPACE, payer=payer,
        seeds=[b"vote", payer.key().as_ref(),poll.key().as_ref()], bump)]
    pub voter_record: Account<'info, VoterRecord>,

    pub system_program: Program<'info, System>,
}
