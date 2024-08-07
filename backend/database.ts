import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let db: Database<sqlite3.Database, sqlite3.Statement>;

export async function openDb() {
  db = await open({
    filename: './nft_data.db',
    driver: sqlite3.Database
  });
  return db;
}

export async function closeDb() {
  if (db) {
    await db.close();
  }
}

export async function createTable() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS nfts (
      mint VARCHAR(64) PRIMARY KEY,
      owner VARCHAR(64),
      staking_points INTEGER
    )
  `);
}

export async function upsertNftData(mint: string, owner: string, stakingPoints: number) {
  await db.run(`
    INSERT INTO nfts (mint, owner, staking_points)
    VALUES (?, ?, ?)
    ON CONFLICT(mint) DO UPDATE SET
      owner=excluded.owner,
      staking_points=excluded.staking_points
  `, [mint, owner, stakingPoints]);
}
