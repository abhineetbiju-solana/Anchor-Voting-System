use anchor_lang::prelude::*;

declare_id!("83n1rqQHGL8WidFW2LuXkG5dkPLLdB2VNoW8TzXG2JNR");

#[program]
pub mod voting_system {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

//designing struct for creating the poll
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
//designing struct for stroing options inside the poll struct
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct Options {
    #[max_len(64)]
    pub description: String,
    pub votes: u64,
}

//designing struct to store list of voters to prevent duplicate votes
#[account]
#[derive(InitSpace)]
pub struct VoterRecord {
    pub poll: Pubkey,     //Pubkey of the poll for which voter has voted
    pub voter: Pubkey,    //Pubkey of the voter
    pub option_index: u8, //Index of the option selected by voter
}

#[derive(Accounts)]
pub struct Initialize {}
