import fs from 'fs';
import { PublicKey, Connection } from "@solana/web3.js";
import { readGoldPoints } from "./readGold";
import { openDb, closeDb, createTable, upsertNftData } from "./database";
import { getHolders } from "./fetchHolders";
require('dotenv').config();

function convertGoldPoints(points: number) {
  const denominations = {
    dust: 0,
    copper: 0,
    silver: 0,
    gold: 0,
    diamond: 0,
  };

  denominations.dust = points % 100;
  points = Math.floor(points / 100);

  denominations.copper = points % 100;
  points = Math.floor(points / 100);

  denominations.silver = points % 100;
  points = Math.floor(points / 100);

  denominations.gold = points % 100;
  points = Math.floor(points / 100);

  denominations.diamond = points;

  return denominations;
}

const main = async () => {
  try {
    console.log('Making snapshot of holders...');
    await getHolders();
  } catch(e) {
    console.error('Failed to update list of holders');
  }
  await openDb();
  await createTable();

  const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=" + process.env.HELIUS_API_KEY);
  const holders = JSON.parse(fs.readFileSync('./holders.json', 'UTF-8'));
  const start = Date.now();
  for (let item of holders) {
    const user = new PublicKey(item.owner);
    const nft = {
      mintAddress: new PublicKey(item.mint),
    };
    const goldPoints = await readGoldPoints({ user, nft, provider: { connection } });
    const denominations = convertGoldPoints(goldPoints);
    await upsertNftData(item.mint, item.owner, goldPoints);
    console.log(item.owner, item.mint, denominations);
  }
  console.log(`Updated gold balances in ${(Math.floor(Date.now() - start) / 1000)} seconds`);

  await closeDb();
};

main();

setInterval(main, 24 * 3600 * 1000);