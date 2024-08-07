import React, { useState, useEffect } from "react";
import { Tooltip } from "react-tooltip";
import mintsData from "../mints/mints.json";
import { backpackLaunchParticipants } from "../participants/backpackLaunchParticipants";
import { pythiaDropParticipants } from "../participants/pythiaDropParticipants";
import { wormholeDropParticipants } from "../participants/wormholeDropParticipants";
import { tensorRaffleParticipants } from "../participants/tensorRaffleParticipants";
import "../styles.css";

interface Mint {
  mint: string;
  id: string;
  badges: (string | null)[];
}

const getBadges = (mint: string): (string | null)[] => {
  const badges = [
    backpackLaunchParticipants.includes(mint) ? "backpack" : null,
    pythiaDropParticipants.includes(mint) ? "pythia" : null,
    wormholeDropParticipants.includes(mint) ? "wormhole" : null,
    tensorRaffleParticipants.includes(mint) ? "tensor" : null,
  ].filter(Boolean);

  badges.push("rickroll");

  while (badges.length < 6) {
    badges.push(null);
  }

  return badges;
};

const badgeDescriptions: { [key: string]: string } = {
  backpack: "Awarded for participating in the Backpack Exchange launch.",
  pythia: "Awarded for participating in the Pythia 1:1 raffle.",
  tensor: "Awarded for participating in the Tensor 1:1 raffle.",
  rickroll: "Rickroll.",
  wormhole: "Wormhole airdrop.",
};

const Home: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Mint | null>(null);
  const [mints, setMints] = useState<Mint[]>([]);

  useEffect(() => {
    setMints(mintsData);
  }, []);

  const handleSearch = () => {
    setError("");
    setResult(null);

    const foundMint = mints.find(
      (mint) => Object.keys(mint)[0] === searchTerm || Object.values(mint)[0] === searchTerm
    );

    if (foundMint) {
      const mint = Object.keys(foundMint)[0];
      const id = Object.values(foundMint)[0];
      const badges = getBadges(mint);

      setResult({ mint, id, badges });
    } else {
      setError("Mint not found");
    }
  };

  return (
    <div className="container">
      <input
        className="search-bar"
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search for a mint or Lad number #"
        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
      />
      {error && <div className="error-message">{error}</div>}
      {result && (
        <div className="results-container">
          <div className="lad-container">
            <img
              className="lad-image"
              src={`https://imageresizer.xnftdata.com/anim=true,fit=contain,width=400,height=400,quality=85/https://madlads.s3.us-west-2.amazonaws.com/images/${result.id}.png`}
              alt={`Mad Lads #${result.id}`}
            />
            <p>
              <a href={`https://www.tensor.trade/item/${result.mint}`} target="_blank" rel="noopener noreferrer">
                See on Tensor
              </a>
            </p>
          </div>
          <div className="badges-container">
            {result.badges.map((badge, index) => (
              <>
                <div
                  key={index}
                  className="badge"
                  data-tooltip-id={`tooltip-${index}`}
                  data-tooltip-content={badge ? badgeDescriptions[badge] : ""}
                >
                  {badge && <img className="badge-image" src={`/badges/${badge}.png`} alt={`${badge}`} />}
                </div>
                <Tooltip id={`tooltip-${index}`} />
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
