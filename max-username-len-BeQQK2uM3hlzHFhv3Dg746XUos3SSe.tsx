use
anchor_lang:
:prelude::*
use
anchor_lang:
:system_program

declare_id!("BEnbE74SakZikgjs8wvec7ou2ZCjA3sZ78o3MyFZbLpg") // Replace with the actual program ID after deployment

// Constants
const MAX_USERNAME_LEN: usize = 32
const MAX_REMARKS_LEN: usize = 100
const TRANSFER_SEED: [u8] = b
;("transfer")
const GROUP_PAYMENT_SEED: [u8] = b
;("group_payment")
const USER_PROFILE_SEED: [u8] = b
;("user_profile")

// Error codes
#
;[error_code]
pub
enum BefkirError {
    #[msg("Username too long")]
    UsernameTooLong,
    #[msg("Remarks too long")]
    RemarksTooLong,
    #[msg("Invalid transfer state")]
    InvalidTransferState,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Group payment already completed")]
    GroupPaymentCompleted,
    #[msg("Transfer amount exceeds balance")]
    TransferAmountExceedsBalance,
}

// Program instructions
#
;[program]
pub
mod
befkir
{
  use
  super
  ::*

  // Register a username
  pub
  fn
  register_username(ctx: Context<RegisterUsername>, username: String) -> Result<()>
  {
    require!(username.len() <= MAX_USERNAME_LEN, BefkirError::UsernameTooLong);

    const user_profile = &mut
    ctx.accounts.user_profile
    user_profile.owner = ctx.accounts.signer.key()
    user_profile.username = username

    emit!(UserRegistered {
            user: user_profile.owner,
            username: user_profile.username.clone(),
        });

    Ok(())
  }

  // Send SOL to an address
  pub
  fn
  send_to_address(
        ctx: Context<SendToAddress>,
        amount: u64,
        remarks: String,
        transfer_id: u64,
    ) -> Result<()> {
        require!(remarks.len() <= MAX_REMARKS_LEN, BefkirError::RemarksTooLong);
  require!(amount > 0, BefkirError::InsufficientFunds);

  // Check if sender has enough funds
  require!(
            ctx.accounts.signer.lamports() >= amount,
            BefkirError::TransferAmountExceedsBalance
        );

  // First initialize all the transfer account data
  {
    const transfer = &mut
    ctx.accounts.transfer
    transfer.sender = ctx.accounts.signer.key()
    transfer.recipient = ctx.accounts.recipient.key()
    transfer.amount = amount
    transfer.remarks = remarks.clone()
    transfer.status = TransferStatus
    ::Pending as u8
  transfer.timestamp = Clock
  ::get()?.unix_timestamp
  }

  // Then perform the transfer
  system_program:
  :transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer
  from: ctx.accounts.signer.to_account_info(), to
  : ctx.accounts.transfer.to_account_info(),
  ,
            ),
            amount,
        )?

// Emit the event
emit!(TransferInitiated
  transfer_id, sender
  : ctx.accounts.transfer.sender,
            recipient: ctx.accounts.transfer.recipient,
            amount,
            remarks,
  )

  Ok(())
}

// Claim a transfer
pub
fn
claim_transfer(ctx: Context<ClaimTransfer>, transfer_id: u64) -> Result<()>
{
  // Validate transfer state and ownership
  require!(
            ctx.accounts.transfer.recipient == ctx.accounts.signer.key(),
            BefkirError::Unauthorized
        );
  require!(
            ctx.accounts.transfer.status == TransferStatus::Pending as u8,
            BefkirError::InvalidTransferState
        );

  // Store the amount to transfer in a local variable
  const transfer_amount = ctx.accounts.transfer.amount

  // Update status before transfer to prevent reentrancy
  ctx.accounts.transfer.status = TransferStatus
  ::Claimed as u8

  // Transfer SOL from transfer account to recipient
  **ctx.accounts.transfer.to_account_info().try_borrow_mut_lamports()? -= transfer_amount
  **ctx.accounts.signer.to_account_info().try_borrow_mut_lamports()? += transfer_amount

  emit!(TransferClaimed
  transfer_id, recipient
  : ctx.accounts.transfer.recipient,
            amount: transfer_amount,
  )

  Ok(())
}

// Refund a transfer
pub
fn
refund_transfer(ctx: Context<RefundTransfer>, transfer_id: u64) -> Result<()> {
        // Validate transfer state and ownership
        require!(
            ctx.accounts.transfer.sender == ctx.accounts.signer.key(),
            BefkirError::Unauthorized
)
require!(
            ctx.accounts.transfer.status == TransferStatus::Pending as u8,
            BefkirError::InvalidTransferState
        )

// Store the amount to refund in a local variable
const refund_amount = ctx.accounts.transfer.amount

// Update status before transfer to prevent reentrancy
ctx.accounts.transfer.status = TransferStatus
::Refunded as u8

// Transfer SOL back to sender
**ctx.accounts.transfer.to_account_info().try_borrow_mut_lamports()? -= refund_amount
**ctx.accounts.signer.to_account_info().try_borrow_mut_lamports()? += refund_amount

emit!(TransferRefunded
{
  transfer_id, sender
  : ctx.accounts.transfer.sender,
            amount: refund_amount,
}
)

Ok(())
}

    // Create a group payment
    pub fn create_group_payment(
        ctx: Context<CreateGroupPayment>,
        payment_id: u64,
        num_participants: u64,
        amount_per_person: u64,
        remarks: String,
    ) -> Result<()>
{
  require!(remarks.len() <= MAX_REMARKS_LEN, BefkirError::RemarksTooLong);
  require!(num_participants > 0, BefkirError::InsufficientFunds);
  require!(amount_per_person > 0, BefkirError::InsufficientFunds);

  const group_payment = &mut
  ctx.accounts.group_payment
  group_payment.creator = ctx.accounts.signer.key()
  group_payment.recipient = ctx.accounts.recipient.key()
  group_payment.total_amount = num_participants * amount_per_person
  group_payment.amount_per_person = amount_per_person
  group_payment.num_participants = num_participants
  group_payment.amount_collected = 0
  group_payment.status = GroupPaymentStatus
  ::Open as u8
  group_payment.remarks = remarks
  group_payment.timestamp = Clock
  ::get()?.unix_timestamp

  emit!(GroupPaymentCreated
  payment_id, creator
  : group_payment.creator,
            recipient: group_payment.recipient,
            total_amount: group_payment.total_amount,
            num_participants,
            remarks: group_payment.remarks.clone(),
  )

  Ok(())
}

// Contribute to a group payment
pub
fn
contribute_to_group_payment(
        ctx: Context<ContributeToGroupPayment>,
        payment_id: u64,
        amount: u64,
    ) -> Result<()> {
        // Validate the group payment state
        require!(
            ctx.accounts.group_payment.status == GroupPaymentStatus::Open as u8,
            BefkirError::GroupPaymentCompleted
)
require!(
            amount == ctx.accounts.group_payment.amount_per_person,
            BefkirError::InsufficientFunds
        )

// Check if contributor has enough funds
require!(
            ctx.accounts.signer.lamports() >= amount,
            BefkirError::TransferAmountExceedsBalance
        );

// Transfer SOL to group payment account
system_program:
:transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer
{
  from: ctx.accounts.signer.to_account_info(), to
  : ctx.accounts.group_payment.to_account_info(),
}
,
            ),
            amount,
        )?

// Update collected amount after transfer succeeds
ctx.accounts.group_payment.amount_collected += amount

emit!(GroupPaymentContributed
{
  payment_id, contributor
  : ctx.accounts.signer.key(),
            amount,
}
)

// Check if group payment is complete
if ctx.accounts.group_payment.amount_collected >= ctx.accounts.group_payment.total_amount {
            // Store the amount to transfer in a local variable
            const transfer_amount = ctx.accounts.group_payment.amount_collected;
            
            // Update status before transfer
            ctx.accounts.group_payment.status = GroupPaymentStatus::Completed as u8;

            // Transfer collected SOL to recipient
            **ctx.accounts.group_payment.to_account_info().try_borrow_mut_lamports()? -= transfer_amount;
            **ctx.accounts.recipient.to_account_info().try_borrow_mut_lamports()? += transfer_amount;

            emit!(GroupPaymentCompleted {
                payment_id,
                recipient: ctx.accounts.group_payment.recipient,
                amount: transfer_amount,
            });
        }

Ok(())
}
}

// Accounts
#[account]
pub struct UserProfile
{
  pub
  owner: Pubkey, pub
  username: String,
}

#
;[account]
pub
struct
Transfer
{
  pub
  sender: Pubkey, pub
  recipient: Pubkey, pub
  amount: u64, pub
  status: u8, pub
  remarks: String, pub
  timestamp: i64,
}

#
;[account]
pub
struct
GroupPayment
{
  pub
  creator: Pubkey, pub
  recipient: Pubkey, pub
  total_amount: u64, pub
  amount_per_person: u64, pub
  num_participants: u64, pub
  amount_collected: u64, pub
  status: u8, pub
  remarks: String, pub
  timestamp: i64,
}

// Enums
#
;[repr(u8)]
pub
enum TransferStatus {
  Pending = 0,
  Claimed = 1,
  Refunded = 2,
}

#
;[repr(u8)]
pub
enum GroupPaymentStatus {
  Open = 0,
  Completed = 1,
}

// Instruction contexts
#
;[derive(Accounts)]
#
[instruction(username: String)]
pub
struct
RegisterUsername<'info> {
#
;[
  account(
    init,
    (payer = signer),
    (space = 8 + 32 + 4 + MAX_USERNAME_LEN), // 8 for discriminator, 32 for Pubkey, 4 for String prefix, then string data
    (seeds = [USER_PROFILE_SEED, signer.key().as_ref()]),
    bump,
  ),
]
pub
user_profile: Account<'info, UserProfile>,
#
;[account(mut)]
pub
signer: Signer<'info>,
pub
system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64, remarks: String, transfer_id: u64)]
pub struct SendToAddress<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + 32 + 32 + 8 + 1 + 4 + MAX_REMARKS_LEN + 8, // Include proper space for all fields
        seeds = [TRANSFER_SEED, signer.key().as_ref(), &transfer_id.to_le_bytes()],
        bump
    )]
    pub transfer: Account<'info, Transfer>,
    #[account(mut)]
    pub signer: Signer<'info>,
    /// CHECK: This is the recipient address, can be any account
    pub recipient: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(transfer_id: u64)]
pub struct ClaimTransfer<'info> {
    #[account(
        mut,
        seeds = [TRANSFER_SEED, transfer.sender.as_ref(), &transfer_id.to_le_bytes()],
        bump,
        constraint = transfer.recipient == signer.key()
@ BefkirError
::Unauthorized,
        constraint = transfer.status == TransferStatus::Pending as u8
@ BefkirError
::InvalidTransferState
    )]
    pub transfer: Account<'info, Transfer>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(transfer_id: u64)]
pub struct RefundTransfer<'info> {
    #[account(
        mut,
        seeds = [TRANSFER_SEED, signer.key().as_ref(), &transfer_id.to_le_bytes()],
        bump,
        constraint = transfer.sender == signer.key()
@ BefkirError
::Unauthorized,
        constraint = transfer.status == TransferStatus::Pending as u8
@ BefkirError
::InvalidTransferState
    )]
    pub transfer: Account<'info, Transfer>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(payment_id: u64, num_participants: u64, amount_per_person: u64, remarks: String)]
pub struct CreateGroupPayment<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + 32 + 32 + 8 + 8 + 8 + 8 + 1 + 4 + MAX_REMARKS_LEN + 8, // Include proper space for all fields
        seeds = [GROUP_PAYMENT_SEED, signer.key().as_ref(), &payment_id.to_le_bytes()],
        bump
    )]
    pub group_payment: Account<'info, GroupPayment>,
    #[account(mut)]
    pub signer: Signer<'info>,
    /// CHECK: This is the recipient address, can be any account
    pub recipient: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(payment_id: u64, amount: u64)]
pub struct ContributeToGroupPayment<'info> {
    #[account(
        mut,
        seeds = [GROUP_PAYMENT_SEED, group_payment.creator.as_ref(), &payment_id.to_le_bytes()],
        bump,
        constraint = group_payment.status == GroupPaymentStatus::Open as u8
@ BefkirError
::GroupPaymentCompleted
    )]
    pub group_payment: Account<'info, GroupPayment>,
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        constraint = recipient.key() == group_payment.recipient
@ BefkirError
::Unauthorized
    )]
    /// CHECK: This account should match the recipient in the group_payment account
    pub recipient: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

// Events
#[event]
pub struct UserRegistered
{
  pub
  user: Pubkey, pub
  username: String,
}

#
;[event]
pub
struct
TransferInitiated
{
  pub
  transfer_id: u64, pub
  sender: Pubkey, pub
  recipient: Pubkey, pub
  amount: u64, pub
  remarks: String,
}

#
;[event]
pub
struct
TransferClaimed
{
  pub
  transfer_id: u64, pub
  recipient: Pubkey, pub
  amount: u64,
}

#
;[event]
pub
struct
TransferRefunded
{
  pub
  transfer_id: u64, pub
  sender: Pubkey, pub
  amount: u64,
}

#
;[event]
pub
struct
GroupPaymentCreated
{
  pub
  payment_id: u64, pub
  creator: Pubkey, pub
  recipient: Pubkey, pub
  total_amount: u64, pub
  num_participants: u64, pub
  remarks: String,
}

#
;[event]
pub
struct
GroupPaymentContributed
{
  pub
  payment_id: u64, pub
  contributor: Pubkey, pub
  amount: u64,
}

#
;[event]
pub
struct
GroupPaymentCompleted
{
  pub
  payment_id: u64, pub
  recipient: Pubkey, pub
  amount: u64,
}
