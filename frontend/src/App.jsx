import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import heroImg from './assets/monkey_hero_v2.png';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-white/10 p-3 rounded-lg shadow-xl">
        <p className="text-indigo-300 font-medium mb-1">{label}</p>
        <p className="text-white">
          Return: <span className={payload[0].value >= 0 ? "text-emerald-400" : "text-rose-400"}>{payload[0].value.toFixed(2)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

function App() {
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState(null);

  const toggleRow = (id) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  useEffect(() => {
    async function fetchPicks() {
      try {
        // You might need to change the fetch URL if this isn't proxied or hosted properly.
        // During dev it's typically full URL or proxied.
        const response = await fetch('/api/picks');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setPicks(data);
      } catch (error) {
        console.error("Error fetching picks:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPicks();
  }, []);

  const todayPick = picks.length > 0 ? picks[0] : null;

  const calculateOverallROI = () => {
    if (picks.length === 0) return 0;
    const validReturns = picks.filter(p => p.total_return_pct !== undefined && p.total_return_pct !== null);
    if (validReturns.length === 0) return 0;
    const sum = validReturns.reduce((acc, curr) => acc + curr.total_return_pct, 0);
    return sum / validReturns.length;
  };

  const overallROI = calculateOverallROI();
  const isPositiveROI = overallROI >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-black text-white font-sans selection:bg-indigo-500 selection:text-white pb-12">
      {/* Background ambient light effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-12">
        {/* Header */}
        <header className="mb-12 flex flex-col items-center justify-center text-center space-y-3 relative">
          <div className="w-32 h-32 mb-6 rounded-full overflow-hidden border-4 border-indigo-400 shadow-[0_0_40px_rgba(99,102,241,0.6)] relative group z-20 bg-indigo-900 flex items-center justify-center">
             <img src={heroImg} alt="Monkey Hero" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300 drop-shadow-sm">
            The Monkey Index
          </h1>
          <p className="text-lg text-indigo-200/80 max-w-xl font-light">
            Can a monkey throwing darts consistently beat Wall Street? Track the results of a completely random daily stock selection.
          </p>
        </header>

        {/* Top Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Today's Pick Card */}
          <section className="relative group bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <h2 className="text-sm font-medium tracking-widest text-indigo-300 uppercase mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              Today's Dart
            </h2>
            
            {loading ? (
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-10 bg-white/10 rounded w-1/2"></div>
                  <div className="h-4 bg-white/10 rounded w-3/4"></div>
                </div>
              </div>
            ) : todayPick ? (
              <div className="relative z-10">
                <a 
                  href={`https://finance.yahoo.com/quote/${todayPick.ticker}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block text-6xl font-black text-white mb-2 tracking-tight drop-shadow-md hover:text-indigo-400 transition-colors cursor-pointer"
                  title={`View ${todayPick.ticker} on Yahoo Finance`}
                >
                  ${todayPick.ticker}
                </a>
                <div className="flex flex-col items-start gap-3 mt-2">
                  <span className="text-sm text-indigo-200/70">Picked on: {todayPick.pick_date}</span>
                  {todayPick.pick_price !== null && (
                     <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-300 font-semibold shadow-sm flex items-center gap-2">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       Morning Price: ${todayPick.pick_price.toFixed(2)}
                     </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-indigo-200/50 font-light text-xl">Waiting for market pick...</div>
            )}
          </section>

          {/* Overall ROI Card */}
          <section className="relative group bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 shadow-2xl overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <h2 className="text-sm font-medium tracking-widest text-indigo-300 uppercase mb-6 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Overall Return
            </h2>
            <div className="relative z-10 flex flex-col justify-center h-full pb-4">
              <span className={`text-6xl font-black tracking-tight drop-shadow-lg mb-2 ${isPositiveROI ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositiveROI ? '+' : ''}{overallROI.toFixed(2)}%
              </span>
              <p className="text-sm text-indigo-200/70 font-light">
                Average across <span className="text-white font-medium">{picks.length}</span> total historical picks
              </p>
            </div>
          </section>

        </div>

        {/* History Table */}
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden mt-8">
          <div className="px-8 py-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <h2 className="font-semibold text-xl text-white tracking-wide">Historical Picks Ledger</h2>
            <div className="text-xs font-medium px-3 py-1 rounded-full bg-white/10 text-indigo-200 uppercase tracking-widest">
              Live Data
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-black/20 text-indigo-300/80 text-xs uppercase tracking-wider">
                  <th className="px-8 py-5 font-semibold">Date</th>
                  <th className="px-8 py-5 font-semibold">Ticker</th>
                  <th className="px-8 py-5 font-semibold text-right">Morning Entry</th>
                  <th className="px-8 py-5 font-semibold text-right">Latest Close</th>
                  <th className="px-8 py-5 font-semibold text-right">Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-indigo-300/50 animate-pulse">Loading historical ledger...</td>
                  </tr>
                ) : picks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-indigo-300/50">No picks available yet.</td>
                  </tr>
                ) : (
                  picks.map((pick) => {
                    const returnVal = pick.total_return_pct || 0;
                    const isPositive = returnVal >= 0;
                    const isExpanded = expandedRowId === pick.id;
                    const hasHistory = pick.history && pick.history.length > 0;
                    
                    return (
                      <React.Fragment key={pick.id}>
                      <tr 
                        className="hover:bg-white/5 transition-colors duration-200 group cursor-pointer"
                        onClick={() => toggleRow(pick.id)}
                      >
                        <td className="px-8 py-5 text-indigo-100/70 font-light">{pick.pick_date}</td>
                        <td className="px-8 py-5">
                          <a 
                            href={`https://finance.yahoo.com/quote/${pick.ticker}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-white bg-white/10 px-3 py-1 rounded-md hover:bg-indigo-500/40 hover:text-white transition-all inline-flex items-center gap-1.5"
                            title={`View ${pick.ticker} on Yahoo Finance`}
                          >
                            {pick.ticker}
                            <svg className="w-3 h-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          </a>
                        </td>
                        <td className="px-8 py-5 text-right font-medium text-indigo-100/90">
                           {pick.pick_price !== undefined && pick.pick_price !== null ? `$${pick.pick_price.toFixed(2)}` : <span className="text-white/30 italic font-light">Pending</span>}
                        </td>
                        <td className="px-8 py-5 text-right font-medium text-white/90">
                           {pick.current_price !== undefined && pick.current_price !== null ? `$${pick.current_price.toFixed(2)}` : <span className="text-white/30 italic font-light">Pending</span>}
                        </td>
                        <td className="px-8 py-5 text-right font-bold">
                          {pick.pick_price !== undefined && pick.pick_price !== null ? (
                            <span className={`px-3 py-1 rounded-md ${isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                              {isPositive ? '+' : ''}{returnVal.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-white/30 italic font-light px-3 py-1">--</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-black/40">
                           <td colSpan={5} className="px-8 py-6 border-b border-indigo-500/20">
                             {hasHistory ? (
                               <div className="h-64 w-full px-4">
                                  <h3 className="text-indigo-300 text-sm font-semibold tracking-wider uppercase mb-4 flex items-center justify-between">
                                    <span>Historical Performance</span>
                                    <span className="text-xs font-light tracking-normal lowercase opacity-70 border border-white/10 px-2 py-0.5 rounded-full">{pick.history.length} data points</span>
                                  </h3>
                                  <ResponsiveContainer width="100%" height="85%">
                                    <LineChart data={pick.history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                      <XAxis dataKey="date" stroke="#ffffff50" tick={{fill: '#ffffff80', fontSize: 12}} tickMargin={10} axisLine={false} tickLine={false} />
                                      <YAxis stroke="#ffffff50" tick={{fill: '#ffffff80', fontSize: 12}} tickFormatter={(val) => `${val}%`} tickMargin={10} axisLine={false} tickLine={false} />
                                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff20', strokeWidth: 1, strokeDasharray: '3 3' }} />
                                      <Line type="monotone" dataKey="return_pct" stroke={isPositive ? '#34d399' : '#fb7185'} strokeWidth={3} dot={{ fill: isPositive ? '#34d399' : '#fb7185', strokeWidth: 2, r: 4, stroke: '#1e1b4b' }} activeDot={{ r: 6, fill: '#ffffff', stroke: isPositive ? '#34d399' : '#fb7185', strokeWidth: 2 }} />
                                    </LineChart>
                                  </ResponsiveContainer>
                               </div>
                             ) : (
                               <div className="text-center text-indigo-200/50 py-8 italic font-light">No historical chart data available for this pick yet.</div>
                             )}
                           </td>
                        </tr>
                      )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Disclaimer Footer */}
        <footer className="mt-12 text-center text-xs text-indigo-200/40 pb-8 px-6 max-w-3xl mx-auto leading-relaxed">
          <p>
            Disclaimer: The Monkey Index and all associated content are for entertainment purposes only and do not constitute financial, investment, or legal advice. 
            The stock picks generated are completely randomized and should not be used as the basis for any investment decisions. 
            Always do your own research or consult with a qualified financial advisor before making any investments.
          </p>
        </footer>

      </div>
    </div>
  );
}

export default App;
