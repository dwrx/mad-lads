import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

const app = express();
const port = 8888;
app.use(cors());

let db: Database<sqlite3.Database, sqlite3.Statement>;

async function openDb() {
  db = await open({
    filename: './nft_data.db',
    driver: sqlite3.Database
  });
  return db;
}


async function getTotalStakingPoints() {
  const totalPointsQuery = `
    SELECT SUM(staking_points) AS total_staking_points
    FROM nfts
  `;
  const result = await db.get(totalPointsQuery);
  return result.total_staking_points;
}

async function getLeaderboard(page: number, limit: number, search: string) {
  const offset = (page - 1) * limit;
  const searchParam = search ? `%${search}%` : '%';

  const leaderboardQuery = `
    SELECT owner, COUNT(mint) AS nft_count, SUM(staking_points) AS total_staking_points
    FROM nfts
    WHERE owner LIKE ?
    GROUP BY owner
    ORDER BY total_staking_points DESC
    LIMIT ? OFFSET ?
  `;

  return await db.all(leaderboardQuery, [searchParam, limit, offset]);
}

app.get('/api/v1/leaderboard', async (req, res) => {
  const { page = 1, limit = 100, search = '' } = req.query;
  try {
    const leaderboard = await getLeaderboard(Number(page), Number(limit), String(search));
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/v1/total-staking-points', async (req, res) => {
  try {
    const totalStakingPoints = await getTotalStakingPoints();
    res.json({ total_staking_points: totalStakingPoints });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

(async () => {
  await openDb();
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
})();
