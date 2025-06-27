import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';

const statLabelMap = {
  TOTAL_BASES: 'Total Bases', H: 'Hits', HR: 'Home Runs', R: 'Runs', RBI: 'RBIs',
  SO: 'Strikeouts', BB: 'Walks', ER: 'Earned Runs', H_PITCH: 'Hits Allowed'
};

const statOptionsHitter = [
  { key: 'TOTAL_BASES', label: 'Total Bases' }, { key: 'H', label: 'Hits' },
  { key: 'HR', label: 'Home Runs' }, { key: 'R', label: 'Runs' }, { key: 'RBI', label: 'RBIs' }
];
const statOptionsPitcher = [
  { key: 'SO', label: 'Strikeouts' }, { key: 'BB', label: 'Walks' },
  { key: 'ER', label: 'Earned Runs' }, { key: 'H', label: 'Hits Allowed' }
];

const CustomTooltip = ({ active, payload, label, selectedStat }) => {
  if (active && payload && payload.length) {
    const stat = payload[0].payload;
    return (
      <div className="p-3 bg-gray-900 border border-green-500 rounded shadow-md text-white text-sm">
        <div className="font-semibold text-green-300">{label} vs {stat.Opponent}</div>
        <div className="mt-1 font-semibold text-green-400">{statLabelMap[selectedStat] || selectedStat}: {stat[selectedStat]}</div>
      </div>
    );
  }
  return null;
};

export default function PlayerStatsPage({ playerName, onBack }) {
  const [playerInfo, setPlayerInfo] = useState({});
  const [logs, setLogs] = useState([]);
  const [hittingLogs, setHittingLogs] = useState([]);
  const [pitchingLogs, setPitchingLogs] = useState([]);
  const [showPitching, setShowPitching] = useState(false);
  const [careerStats, setCareerStats] = useState(null);
  const [hittingStats, setHittingStats] = useState(null);
  const [pitchingStats, setPitchingStats] = useState(null);
  const [error, setError] = useState(null);
  const [selectedStat, setSelectedStat] = useState('TOTAL_BASES');
  const [selectedPitcherStat, setSelectedPitcherStat] = useState('SO');
  const [isDual, setIsDual] = useState(false);
  const [isPitcher, setIsPitcher] = useState(false);

  useEffect(() => {
    const fetchPlayerInfo = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:5000/api/mlbid/${encodeURIComponent(playerName)}`);
        setPlayerInfo(res.data);
        setIsDual(res.data.player === 'Shohei Ohtani');
        // Better pitcher detection: pos = 'P' or starts with 'P' (e.g., 'P', 'P/DH')
        setIsPitcher(
          !res.data.player || res.data.player === 'Shohei Ohtani' 
            ? false
            : (res.data.position && res.data.position.toUpperCase().startsWith('P'))
        );
        // Set default stat tab
        setShowPitching(res.data.position && res.data.position.toUpperCase().startsWith('P'));
        setSelectedStat('TOTAL_BASES');
        setSelectedPitcherStat('SO');
      } catch {
        setPlayerInfo({});
        setIsDual(false);
        setIsPitcher(false);
      }
    };
    fetchPlayerInfo();
  }, [playerName]);

  useEffect(() => {
    const fetchStats = async () => {
      setError(null);
      setCareerStats(null);
      setLogs([]); setHittingLogs([]); setPitchingLogs([]);
      setHittingStats(null); setPitchingStats(null);
      try {
        const logsRes = await axios.get(`http://127.0.0.1:5000/api/playerlogs/${encodeURIComponent(playerName)}`);
        if (logsRes.data.hitting_logs && logsRes.data.pitching_logs) {
          setHittingLogs((logsRes.data.hitting_logs || []).map(log => ({
            ...log, Date: new Date(log.Date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
          })));
          setPitchingLogs((logsRes.data.pitching_logs || []).map(log => ({
            ...log, Date: new Date(log.Date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
          })));
          try {
            const dualStats = await axios.get(`http://127.0.0.1:5000/api/dual_seasonstats/${encodeURIComponent(playerName)}`);
            setHittingStats(dualStats.data.hitting_stats || null);
            setPitchingStats(dualStats.data.pitching_stats || null);
          } catch {/*ignore*/}
        } else {
          setLogs((logsRes.data.logs || []).map(log => ({
            ...log, Date: new Date(log.Date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
          })));
          try {
            const statsRes = await axios.get(`http://127.0.0.1:5000/api/seasonstats/${encodeURIComponent(playerName)}`);
            setCareerStats(statsRes.data.season_stats || null);
          } catch {/* ignore */}
        }
      } catch (err) {
        setError('Failed to fetch player logs/stats.');
      }
    };
    fetchStats();
  }, [playerName, isDual]);

  const statOptions = (isDual ? (showPitching ? statOptionsPitcher : statOptionsHitter) : (isPitcher ? statOptionsPitcher : statOptionsHitter));
  const activeLogs = isDual ? (showPitching ? pitchingLogs : hittingLogs) : logs;
  const activeStat = isDual ? (showPitching ? selectedPitcherStat : selectedStat) : (isPitcher ? selectedPitcherStat : selectedStat);

const renderProfileStatsRow = () => {
  if (!playerInfo?.player) return null;
  let stats = isDual ? (showPitching ? pitchingStats : hittingStats) : careerStats;
  const hasStats = stats && typeof stats === 'object' && Object.keys(stats).length > 0;
  return (
    <div className="flex flex-col sm:flex-row gap-7 mb-4 max-w-5xl mx-auto items-center">
      <div className="flex-shrink-0 w-40 h-40 sm:w-60 sm:h-60 rounded-3xl overflow-hidden border-4 border-green-400 bg-gray-800 shadow-2xl">
        <img
          src={`https://securea.mlb.com/mlb/images/players/head_shot/${playerInfo.mlbid}.jpg`}
          alt={playerInfo.player}
          className="w-full h-full object-cover"
        />
      </div>
      <motion.div
        initial={{ opacity: 0, x: 32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, type: 'spring', bounce: 0.2 }}
        className="flex-1"
      >
        <h2 className="text-4xl font-extrabold text-white leading-tight mb-2">{playerInfo.player}</h2>
        <div className="text-green-300 text-xl font-semibold mb-6">{playerInfo.team} <span className="text-white">·</span> {playerInfo.position}</div>
        {hasStats && (
          <div className="bg-gray-800/90 rounded-2xl px-10 py-7 max-w-3xl mx-auto shadow-xl">
            <h3 className="text-2xl font-bold text-gray-100 mb-5">2025 Season Stats</h3>
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-y-4 gap-x-8 text-lg">
              {(isDual ? showPitching : isPitcher) ? (
                <>
                  <div><span className="text-gray-400">G</span><div className="font-bold text-xl mt-1">{stats?.gamesPitched ?? stats?.games ?? '-'}</div></div>
                  <div><span className="text-gray-400">IP</span><div className="font-bold text-xl mt-1">{stats?.inningsPitched ?? '-'}</div></div>
                  <div><span className="text-gray-400">W-L</span><div className="font-bold text-xl mt-1">{stats?.wins ?? '-'}-{stats?.losses ?? '-'}</div></div>
                  <div><span className="text-gray-400">ERA</span><div className="font-bold text-xl mt-1">{stats?.era ?? '-'}</div></div>
                  <div><span className="text-gray-400">SO</span><div className="font-bold text-xl mt-1">{stats?.strikeOuts ?? stats?.SO ?? stats?.strikeouts ?? '-'}</div></div>
                  <div><span className="text-gray-400">BB</span><div className="font-bold text-xl mt-1">{stats?.baseOnBalls ?? stats?.BB ?? stats?.walks ?? '-'}</div></div>
                </>
              ) : (
                <>
                  <div><span className="text-gray-400">AVG</span><div className="font-bold text-xl mt-1">{stats?.avg || stats?.AVG || '0.000'}</div></div>
                  <div><span className="text-gray-400">HR</span><div className="font-bold text-xl mt-1">{stats?.homeRuns || stats?.HR || 0}</div></div>
                  <div><span className="text-gray-400">RBI</span><div className="font-bold text-xl mt-1">{stats?.rbi || stats?.RBI || 0}</div></div>
                  <div><span className="text-gray-400">R</span><div className="font-bold text-xl mt-1">{stats?.runs || stats?.R || 0}</div></div>
                  <div><span className="text-gray-400">H</span><div className="font-bold text-xl mt-1">{stats?.hits || stats?.H || 0}</div></div>
                  <div><span className="text-gray-400">OPS</span><div className="font-bold text-xl mt-1">{stats?.ops || stats?.OPS || '0.000'}</div></div>
                </>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900 text-white font-sans p-6">
      <header className="mb-6 flex flex-row items-start justify-between max-w-6xl mx-auto w-full">
        {renderProfileStatsRow()}
        <div className="w-auto self-start ml-4">
          <button onClick={onBack} className="bg-green-500 px-7 py-3 rounded-xl hover:bg-green-600 font-bold text-lg text-black shadow-xl mt-2 sm:mt-0">Back</button>
        </div>
      </header>
      {isDual && (
        <div className="flex gap-4 justify-center mb-8 mt-2">
          <button onClick={() => setShowPitching(false)} className={`px-7 py-3 rounded-xl font-bold text-lg shadow-md transition ${!showPitching ? 'bg-green-500 text-black' : 'bg-gray-700 text-green-200'}`}>Hitting</button>
          <button onClick={() => setShowPitching(true)} className={`px-7 py-3 rounded-xl font-bold text-lg shadow-md transition ${showPitching ? 'bg-green-500 text-black' : 'bg-gray-700 text-green-200'}`}>Pitching</button>
        </div>
      )}
      {error && <div className="text-center text-red-400 mb-4 font-semibold">{error}</div>}
      {activeLogs && activeLogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, type: 'spring', bounce: 0.13 }}
          className="bg-gray-900/90 p-8 rounded-3xl border-2 border-green-400 max-w-4xl mx-auto shadow-xl mb-14"
        >
          <h3 className="text-xl font-bold text-green-300 mb-6 flex flex-col sm:flex-row sm:items-center gap-2">
            <span>{statLabelMap[activeStat] || activeStat} <span className="text-gray-400 font-normal">– Last 10 Games</span></span>
          </h3>
          <div className="flex flex-wrap justify-center gap-4 mb-7">
            {statOptions.map(opt => (
              <button
                key={opt.key}
                className={`px-5 py-2 rounded-xl text-base font-bold border-2 transition-all duration-100 shadow-sm focus:outline-none ${
                  activeStat === opt.key
                    ? 'bg-green-500 text-black border-green-600 scale-105'
                    : 'bg-white/90 text-gray-900 border-gray-300 hover:bg-green-100'
                }`}
                onClick={() => (isDual ? (showPitching ? setSelectedPitcherStat(opt.key) : setSelectedStat(opt.key)) : (isPitcher ? setSelectedPitcherStat(opt.key) : setSelectedStat(opt.key)))}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={370}>
            <BarChart data={activeLogs} margin={{ top: 14, right: 32, left: 0, bottom: 36 }} barGap={4}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.88}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.83}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="5 6" stroke="#2a2b3a" />
              <XAxis dataKey="Date" stroke="#c3f7d6" tickLine={false} axisLine={{stroke: '#c3f7d6'}} fontSize={16} />
              <YAxis stroke="#c3f7d6" domain={[0, 'dataMax + 1']} fontSize={15} tickLine={false} axisLine={{stroke: '#c3f7d6'}} />
              <Tooltip content={<CustomTooltip selectedStat={activeStat} />} cursor={{ fill: '#00FF8833' }} />
              <Bar dataKey={activeStat} fill="url(#barGradient)" radius={[10, 10, 0, 0]} barSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
      <footer className="text-center text-gray-500 mt-12 text-sm">
        &copy; 2025 Kyle Nguyen. Built with data from MLB StatsAPI.
      </footer>
    </div>
  );
}
