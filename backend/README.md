### Lads on top

Backend scripts and API server to fetch Mad Lads NFT holders and their staking points.

#### Scripts

- **`fetchHolders.ts`**: Fetches all Lads holders with their NFT mints and saves the data to `holders.json`.
- **`main.ts`**: Reads `holders.json` and fetches both claimed and unclaimed staking points for each holder/mint pair. The data is then saved to a local SQLite3 database.
- **`express.ts`**: An API server that provides endpoints for retrieving the leaderboard and total staking points. It reads data from the local SQLite3 database.

#### Getting Started

Copy `.env.sample` to `.env` and put Helius API key.

1. **Fetch NFT holders** (~20 seconds)
```
ts-node fetchHolders.ts
```

2. **Fetch staking points and save to database** (~45-60 minutes)
```
ts-node main.ts
```

3. **Start API server**
```
ts-node express.ts
```

##### API endpoints
```
GET /api/v1/leaderboard
GET /api/v1/total-staking-points
```
