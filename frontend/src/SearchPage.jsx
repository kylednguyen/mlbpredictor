import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// StatCard subcomponent
function StatCard({ title, teams, loading }) {
  return (
    <div
      className="flex flex-col bg-[#14202d] rounded-2xl shadow-xl border border-red-400 min-w-[300px] max-w-xs min-h-[290px] p-5 transition-transform hover:scale-[1.018]"
      style={{ fontFamily: 'Inter, Montserrat, Segoe UI, Arial, sans-serif' }}
    >
      <div className="text-center text-xl font-bold border-b border-red-300 pb-2 pt-1 mb-2 tracking-wide uppercase text-white">
        {title}
      </div>
      <div className="flex-1 flex flex-col justify-start px-1 py-1">
        <table className="w-full text-base text-left">
          <thead>
            <tr className="text-red-200 font-semibold text-sm">
              <th className="pl-2">Team</th>
              <th>W</th>
              <th>L</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="text-center py-4 text-white/80">
                  Loading...
                </td>
              </tr>
            ) : teams.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-4 text-white/80">
                  No data
                </td>
              </tr>
            ) : (
              teams.map((team) => (
                <tr
                  key={team.team}
                  className="text-white border-b border-red-200/10 last:border-0 hover:bg-white/5 transition"
                  style={{ height: 44 }}
                >
                  <td className="py-2 font-bold pl-2">{team.abbreviation || team.team}</td>
                  <td>{team.wins}</td>
                  <td>{team.losses}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SearchPage({
  allPlayers,
  onSearch,
  suggestionInfo,
  fetchSuggestionInfo,
}) {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef(null);

  // RISERS/DROPPERS state and fetching
  const [risers, setRisers] = useState([]);
  const [droppers, setDroppers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("http://127.0.0.1:5000/api/risersdroppers")
      .then((res) => res.json())
      .then((data) => {
        setRisers(data.risers || []);
        setDroppers(data.droppers || []);
        setLoading(false);
      })
      .catch(() => {
        setRisers([]);
        setDroppers([]);
        setLoading(false);
      });
  }, []);

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearch(value);
    const filtered = allPlayers
      .filter((name) => name.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 5);
    setSuggestions(filtered);
    setHighlightIndex(-1);
    if (filtered.length) await fetchSuggestionInfo(filtered);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setHighlightIndex((prev) =>
        prev + 1 < suggestions.length ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      setHighlightIndex((prev) => (prev - 1 >= 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      if (highlightIndex >= 0 && suggestions[highlightIndex]) {
        onSearch(suggestions[highlightIndex]);
      } else if (search.trim()) {
        onSearch(search.trim());
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) onSearch(search.trim());
  };

  return (
    <div
      className="min-h-screen w-full bg-gradient-to-br from-[#423c3c] via-[#122530] to-[#321111] flex flex-col items-center py-12 px-4 font-sans"
      style={{ fontFamily: 'Inter, Montserrat, Segoe UI, Arial, sans-serif' }}
    >
      {/* HEADER */}
      <div className="flex w-full max-w-6xl items-center justify-between mb-16">
        <h1
          className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-red-300 to-red-500 bg-clip-text text-transparent drop-shadow-2xl select-none tracking-tight"
          style={{ fontFamily: 'Inter, Montserrat, Segoe UI, Arial, sans-serif' }}
        >
          sweat.ai
        </h1>
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="relative w-[270px]">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search MLB players..."
              className="px-5 py-4 rounded-xl bg-white/95 text-black w-full shadow-lg focus:ring-4 focus:ring-red-400/50 text-lg border-2 border-red-300 placeholder-gray-400 font-semibold"
              value={search}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              autoFocus
              style={{ fontFamily: 'Inter, Montserrat, Segoe UI, Arial, sans-serif' }}
            />
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute left-0 right-0 top-full bg-white/95 text-black rounded-xl shadow-lg mt-2 z-30 overflow-hidden border border-red-100"
                >
                  {suggestions.map((name, idx) => {
                    const info = suggestionInfo[name] || {};
                    return (
                      <motion.li
                        key={idx}
                        className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors text-base ${
                          idx === highlightIndex
                            ? "bg-red-200 font-bold"
                            : "hover:bg-red-100"
                        }`}
                        onClick={() => onSearch(name)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ fontFamily: 'Inter, Montserrat, Segoe UI, Arial, sans-serif' }}
                      >
                        {info.headshot && (
                          <img
                            src={info.headshot}
                            alt={name}
                            className="w-8 h-8 rounded-full object-cover border border-red-300"
                          />
                        )} 
                        <div>
                          <span>{name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {info.team}
                            {info.position ? ` · ${info.position}` : ""}
                          </span>
                        </div>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
          <button
            type="submit"
            className="bg-red-500 px-6 py-3 rounded-xl hover:bg-red-600 font-bold text-lg text-black shadow-lg active:scale-95 transition-all"
            style={{ fontFamily: 'Inter, Montserrat, Segoe UI, Arial, sans-serif' }}
          >
            Search
          </button>
        </form>
      </div>

      {/* RISERS/DROPPERS CARDS */}
      <div className="flex flex-col items-center w-full">
        <div className="flex flex-col md:flex-row gap-10 w-full max-w-4xl justify-center">
          {/* RISERS CARD */}
          <StatCard title="RISERS" teams={risers} loading={loading} />
          {/* DROPPERS CARD */}
          <StatCard title="DROPPERS" teams={droppers} loading={loading} />
        </div>
      </div>
    </div>
  );
}
