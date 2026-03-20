import React, { useEffect, useState } from 'react';

function App() {
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPicks() {
      try {
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
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-bold text-gray-900">The Monkey Index</h1>
          <p className="text-gray-500 mt-2">Can a monkey throwing darts beat the stock market?</p>
        </header>

        {/* Top Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Today's Pick */}
          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-sm font-semibold tracking-wider text-gray-500 uppercase mb-4">Today's Dart</h2>
            {loading ? (
              <div className="text-gray-400">Loading...</div>
            ) : todayPick ? (
              <div>
                <p className="text-5xl font-extrabold text-blue-600 mb-2">${todayPick.ticker}</p>
                <p className="text-sm text-gray-500">Selected on {todayPick.pick_date}</p>
              </div>
            ) : (
              <div className="text-gray-400">Waiting for market open...</div>
            )}
          </section>

          {/* Overall ROI */}
          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-sm font-semibold tracking-wider text-gray-500 uppercase mb-4">Overall Return</h2>
            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-5xl font-extrabold ${isPositiveROI ? 'text-green-600' : 'text-red-600'}`}>
                {isPositiveROI ? '+' : ''}{overallROI.toFixed(2)}%
              </span>
            </div>
            <p className="text-sm text-gray-500">Across {picks.length} total picks</p>
          </section>

        </div>

        {/* History Table */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-800">Historical Picks</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-3 font-semibold border-b border-gray-200">Date</th>
                  <th className="px-6 py-3 font-semibold border-b border-gray-200">Ticker</th>
                  <th className="px-6 py-3 font-semibold text-right border-b border-gray-200">Entry Price</th>
                  <th className="px-6 py-3 font-semibold text-right border-b border-gray-200">Latest Core</th>
                  <th className="px-6 py-3 font-semibold text-right border-b border-gray-200">Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading data...</td>
                  </tr>
                ) : picks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No picks available yet.</td>
                  </tr>
                ) : (
                  picks.map((pick) => {
                    const returnVal = pick.total_return_pct || 0;
                    const isPositive = returnVal >= 0;
                    return (
                      <tr key={pick.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-700">{pick.pick_date}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{pick.ticker}</td>
                        <td className="px-6 py-4 text-right text-gray-600">
                           {pick.pick_price ? `$${pick.pick_price.toFixed(2)}` : 'Wait EOD'}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                           {pick.current_price ? `$${pick.current_price.toFixed(2)}` : 'Wait EOD'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {pick.pick_price ? (
                            <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {isPositive ? '+' : ''}{returnVal.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}

export default App;
