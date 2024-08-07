import { IDL as SoulBoundIdl } from "./idls/soulBoundAuthority";
import { IDL as CardinalStakePoolIdl } from "./idls/cardinalStakePool";
import { IDL as CardinalRewardDistributorIdl } from "./idls/cardinalRewardDistributor";

const anchor = require("@coral-xyz/anchor");
const { PublicKey } = require("@solana/web3.js");
const { Program } = require("@coral-xyz/anchor");
const { getAccount, getAssociatedTokenAddress } = require("@solana/spl-token");
const { BN } = anchor;

const SOUL_BOUND_PROGRAM_ID = new PublicKey("7DkjPwuKxvz6Viiawtbmb4CqnMKP6eGb1WqYas1airUS");
const CARDINAL_REWARD_DISTRIBUTOR_PROGRAM_ID = new PublicKey("H2yQahQ7eQH8HXXPtJSJn8MURRFEWVesTd8PsracXp1S");
const CARDINAL_STAKE_POOL_PROGRAM_ID = new PublicKey("2gvBmibwtBnbkLExmgsijKy6hGXJneou8X6hkyWQvYnF");
const STAKE_POOL = new PublicKey("7xmGGtuNNvjKLDwbYWBYGPpAjRqftJnrTyzSRK92yku8");
const REWARD_DISTRIBUTOR = new PublicKey("6DBnpqRm1szSz25dD1aWEmYzgGoMB59Y1GMv2gtWUSM4");
const GOLD_MINT = new PublicKey("5QPAPkBvd2B7RQ6DBGvCxGdAcyWitdvRAP58CdvBiuf7");

type ReadGoldInput = {
  user: typeof PublicKey;
  nft: {
    mintAddress: typeof PublicKey;
  };
  provider: any;
};

async function readGoldPoints({ user, nft, provider }: ReadGoldInput) {
  const stakePoolProgram = new Program(CardinalStakePoolIdl, CARDINAL_STAKE_POOL_PROGRAM_ID, provider);
  const rewardDistributorProgram = new Program(
    CardinalRewardDistributorIdl,
    CARDINAL_REWARD_DISTRIBUTOR_PROGRAM_ID,
    provider
  );
  const soulBoundProgram = new Program(SoulBoundIdl, SOUL_BOUND_PROGRAM_ID, provider);

  const fetchStakeEntry = async () => {
    try {
      const stakeEntry = PublicKey.findProgramAddressSync(
        [
          Buffer.from("stake-entry"),
          STAKE_POOL.toBuffer(),
          nft.mintAddress.toBuffer(),
          getStakeSeed(1, user).toBuffer(),
        ],
        stakePoolProgram.programId
      )[0];
      return await stakePoolProgram.account.stakeEntry.fetch(stakeEntry);
    } catch (e) {
      return null;
    }
  };

  const fetchRewardEntry = async () => {
    const stakeEntry = PublicKey.findProgramAddressSync(
      [Buffer.from("stake-entry"), STAKE_POOL.toBuffer(), nft.mintAddress.toBuffer(), getStakeSeed(1, user).toBuffer()],
      stakePoolProgram.programId
    )[0];
    const rewardEntry = PublicKey.findProgramAddressSync(
      [Buffer.from("reward-entry"), REWARD_DISTRIBUTOR.toBuffer(), stakeEntry.toBuffer()],
      rewardDistributorProgram.programId
    )[0];
    return await rewardDistributorProgram.account.rewardEntry.fetch(rewardEntry);
  };

  const readUnclaimedGoldPoints = async () => {
    const stakeEntryAcc = await fetchStakeEntry();
    if (!stakeEntryAcc) {
      return new BN(0);
    }
    const rewardEntryAcc = await fetchRewardEntry();
    if (!rewardEntryAcc) {
      return new BN(0);
    }

    if (stakeEntryAcc.lastStaker.equals(PublicKey.default)) {
      return new BN(0);
    }
    if (stakeEntryAcc.amount.eq(new BN(0))) {
      return new BN(0);
    }

    const totalStakeSeconds = stakeEntryAcc.totalStakeSeconds.add(
      stakeEntryAcc.amount.eq(new BN(0)) ? new BN(0) : new BN(Date.now() / 1000).sub(stakeEntryAcc.lastUpdatedAt)
    );
    const rewardSecondsReceived = rewardEntryAcc.rewardSecondsReceived;
    const rewardDistributorAcc = await rewardDistributorProgram.account.rewardDistributor.fetch(REWARD_DISTRIBUTOR);
    let rewardAmountToReceive = totalStakeSeconds
      .sub(rewardSecondsReceived)
      .div(rewardDistributorAcc.rewardDurationSeconds)
      .mul(rewardDistributorAcc.rewardAmount)
      .mul(new BN(1))
      .div(new BN(10).pow(new BN(rewardDistributorAcc.multiplierDecimals)));

    return rewardAmountToReceive;
  };

  const readClaimedGoldPoints = async () => {
    const scopedSbaUserAuthority = PublicKey.findProgramAddressSync(
      [
        Buffer.from("sba-scoped-user-nft-program"),
        user.toBuffer(),
        nft.mintAddress.toBuffer(),
        rewardDistributorProgram.programId.toBuffer(),
      ],
      soulBoundProgram.programId
    )[0];
    const userRewardMintTokenAccount = await getAssociatedTokenAddress(GOLD_MINT, scopedSbaUserAuthority, true);

    const claimedAmount = await (async () => {
      try {
        const rewardTokenAccount = await getAccount(provider.connection, userRewardMintTokenAccount);
        return new BN(rewardTokenAccount.amount.toString());
      } catch {
        return new BN(0);
      }
    })();

    return claimedAmount;
  };
  const unclaimed = await readUnclaimedGoldPoints();
  const claimed = await readClaimedGoldPoints();
  const native = unclaimed.add(claimed);
  const decimals = 0;
  return native.toNumber() / 10 ** decimals;
}

// Supply is the token supply of the nft mint.
function getStakeSeed(supply: number, user: typeof PublicKey): typeof PublicKey {
  if (supply > 1) {
    return user;
  } else {
    return PublicKey.default;
  }
}

export { readGoldPoints };
