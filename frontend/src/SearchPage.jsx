import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchPage({
  allPlayers,
  onSearch,
  suggestionInfo,
  fetchSuggestionInfo,
}) {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef(null);

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearch(value);
    const filtered = allPlayers.filter(name => name.toLowerCase().includes(value.toLowerCase())).slice(0, 5);
    setSuggestions(filtered);
    setHighlightIndex(-1);
    if (filtered.length) await fetchSuggestionInfo(filtered);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      setHighlightIndex(prev => (prev + 1 < suggestions.length ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      setHighlightIndex(prev => (prev - 1 >= 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
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
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: 'spring', bounce: 0.22 }}
        className="flex flex-col items-center w-full max-w-xl"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold text-green-400 drop-shadow-xl mb-10 tracking-tight text-center select-none">
          <span className="bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">Vegas Insider</span>
        </h1>
        <form onSubmit={handleSubmit} className="flex justify-center gap-3 w-full relative">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search MLB players..."
              className="px-6 py-5 rounded-2xl bg-white/90 text-black w-full shadow-2xl focus:outline-none focus:ring-4 focus:ring-green-400/60 text-xl border border-green-200 placeholder-gray-400 font-semibold backdrop-blur-sm"
              value={search}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              autoFocus
              style={{ transition: 'box-shadow 0.15s' }}
            />
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute left-0 right-0 top-full bg-white/95 text-black rounded-2xl shadow-2xl mt-2 z-30 overflow-hidden border border-green-100"
                >
                  {suggestions.map((name, idx) => {
                    const info = suggestionInfo[name] || {};
                    return (
                      <motion.li
                        key={idx}
                        className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors text-base ${
                          idx === highlightIndex ? 'bg-green-200 font-bold' : 'hover:bg-green-100'
                        }`}
                        onClick={() => onSearch(name)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <img
                          src={info.headshot || ''}
                          alt={name}
                          className="w-9 h-9 rounded-full object-cover border-2 border-green-300 shadow-sm bg-gray-100"
                          onError={e => (e.target.style.display = 'none')}
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold leading-tight">{name}</span>
                          <span className="text-xs text-gray-500 font-medium">
                            {info.team} {info.position ? `· ${info.position}` : ''}
                          </span>
                        </div>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
          <button type="submit" className="bg-green-500 px-7 py-4 rounded-2xl hover:bg-green-600 font-bold text-lg text-black shadow-xl active:scale-95 transition-all duration-100">
            Search
          </button>
        </form>
        <div className="mt-10 text-center text-gray-300 text-base max-w-lg">
          <span className="opacity-80">Enter a player's name, or try <span className="text-green-200 font-bold">Shohei Ohtani</span>, <span className="text-green-200 font-bold">Mookie Betts</span>, <span className="text-green-200 font-bold">Aaron Judge</span>, ...</span>
        </div>
      </motion.div>
    </div>
  );
}
