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

#[derive(Accounts)]
pub struct Initialize {}
