import { useState, useEffect } from "react";
import SearchPage from "./SearchPage";
import PlayerStatsPage from "./PlayerStatsPage";
import axios from "axios";

export default function App() {
  const [page, setPage] = useState("search"); // "search" or "player"
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [allPlayers, setAllPlayers] = useState([]);
  const [suggestionInfo, setSuggestionInfo] = useState({});

  // Fetch allPlayers once on mount
  useEffect(() => {
    axios.get("http://127.0.0.1:5000/api/allplayers")
      .then(res => setAllPlayers(res.data.players || []));
  }, []);

  // For SearchPage dropdown images
  const fetchSuggestionInfo = async (names) => {
    const info = {};
    await Promise.all(
      names.map(async (name) => {
        try {
          const res = await axios.get(`http://127.0.0.1:5000/api/mlbid/${encodeURIComponent(name)}`);
          info[name] = {
            headshot: `https://securea.mlb.com/mlb/images/players/head_shot/${res.data.mlbid}.jpg`,
            team: res.data.team,
            position: res.data.position,
          };
        } catch {
          info[name] = { headshot: "", team: "", position: "" };
        }
      })
    );
    setSuggestionInfo(info);
  };

  if (page === "search") {
    return (
      <SearchPage
        allPlayers={allPlayers}
        suggestionInfo={suggestionInfo}
        fetchSuggestionInfo={fetchSuggestionInfo}
        onSearch={player => {
          setSelectedPlayer(player);
          setPage("player");
        }}
      />
    );
  }

  return (
    <PlayerStatsPage
      playerName={selectedPlayer}
      onBack={() => setPage("search")}
      allPlayers={allPlayers}
      suggestionInfo={suggestionInfo}
      fetchSuggestionInfo={fetchSuggestionInfo}
    />
  );
}
