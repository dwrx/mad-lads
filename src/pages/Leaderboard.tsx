import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles.css";

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [totalStakingPoints, setTotalStakingPoints] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get("https://lads.miso.one/api/v1/leaderboard", {
        params: { page, limit, search },
      });
      setLeaderboard(response.data);
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
    }
    setLoading(false);
  };

  const fetchTotalStakingPoints = async () => {
    try {
      const response = await axios.get("https://lads.miso.one/api/v1/total-staking-points");
      setTotalStakingPoints(response.data.total_staking_points);
    } catch (error) {
      console.error("Error fetching total staking points:", error);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    fetchTotalStakingPoints();
  }, [page, search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

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

  const renderDenominations = (points: number) => {
    const denominations = convertGoldPoints(points);
    return (
      <div className="denomination-container">
        {denominations.diamond > 0 && (
          <span>
            {denominations.diamond}
            <span className="denomination-circle diamond"></span>
          </span>
        )}
        {denominations.gold > 0 && (
          <span>
            {denominations.gold}
            <span className="denomination-circle gold"></span>
          </span>
        )}
        {denominations.silver > 0 && (
          <span>
            {denominations.silver}
            <span className="denomination-circle silver"></span>
          </span>
        )}
        {denominations.copper > 0 && (
          <span>
            {denominations.copper}
            <span className="denomination-circle copper"></span>
          </span>
        )}
        {denominations.dust > 0 && (
          <span>
            {denominations.dust}
            <span className="denomination-circle dust"></span>
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="container">
      <div className="leaderboard-container">
        <div className="leaderboard-header">
          <input
            type="text"
            className="search-bar"
            placeholder="Search address"
            value={search}
            onChange={handleSearchChange}
          />
          <span className="total-staking-points">{renderDenominations(totalStakingPoints)}</span>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Owner</th>
                  <th>Staking Points</th>
                  <th className="no-mobile">NFT Count</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="owner"><a href={`https://solscan.io/account/${item.owner}`} target="_blank" rel="noopener noreferrer">{item.owner}</a></td>
                    <td>{renderDenominations(item.total_staking_points)}</td>
                    <td className="no-mobile">{item.nft_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination">
              <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <button onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
