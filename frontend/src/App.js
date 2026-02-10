import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, ReferenceLine, CartesianGrid, Legend 
} from 'recharts';

const App = () => {
  const [data, setData] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '1987-05-20', end: '2025-12-31' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch historical data and model results in parallel
        const [resData, resResults] = await Promise.all([
          axios.get(`http://127.0.0.1:5000/api/historical?start=${dateRange.start}`),
          axios.get('http://127.0.0.1:5000/api/results')
        ]);
        setData(resData.data);
        setResults(resResults.data);
      } catch (err) {
        console.error("API Error:", err);
      }
      setLoading(false);
    };
    fetchData();
  }, [dateRange]);

  // --- LOGIC TO REPLICATE PLOTS FROM ANALYSIS.PY ---
  
  // 1. Extract values from model_results.csv
  const tauRow = results.find(r => r['Unnamed: 0'] === 'tau');
  const mu1Row = results.find(r => r['Unnamed: 0'] === 'mu_1');
  const mu2Row = results.find(r => r['Unnamed: 0'] === 'mu_2');

  const tauMeanIndex = tauRow ? Math.round(tauRow.mean) : null;
  const mu1 = mu1Row ? mu1Row.mean : null;
  const mu2 = mu2Row ? mu2Row.mean : null;

  // 2. Map the tau index (from 1.1M rows) to the current sampled data
  const totalOriginalRows = 1108921; 
  const ratio = data.length / totalOriginalRows;
  const sampledTauIndex = tauMeanIndex ? Math.floor(tauMeanIndex * ratio) : null;
  const changeDate = (sampledTauIndex !== null && data[sampledTauIndex]) ? data[sampledTauIndex].Date : null;

  // 3. Filter Geopolitical Events
  const eventMarkers = data.filter(d => d.Event_Name && d.Event_Name !== 'No Event');

  if (loading && data.length === 0) return <div style={{padding: '50px'}}><h2>Loading Analysis Results...</h2></div>;

  return (
    <div style={{ padding: '30px', backgroundColor: '#fcfcfc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1 style={{ color: '#2c3e50', marginBottom: '5px' }}>🛢️ Brent Oil Regime Shift Analysis</h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}>
            <label style={{ fontWeight: 'bold', marginRight: '10px' }}>View from:</label>
            <input 
              type="date" 
              value={dateRange.start} 
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})} 
            />
          </div>
          {changeDate && (
            <div style={{ color: '#e74c3c', fontWeight: 'bold' }}>
              Detected Shift: {changeDate}
            </div>
          )}
        </div>
      </header>

      {/* KPI Cards (Visual summary from analysis.py) */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <div style={{ flex: 1, background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid blue' }}>
          <small style={{ color: '#7f8c8d' }}>Pre-Change Mean (μ1)</small>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{mu1 ? `$${mu1.toFixed(2)}` : '...'}</div>
        </div>
        <div style={{ flex: 1, background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid green' }}>
          <small style={{ color: '#7f8c8d' }}>Post-Change Mean (μ2)</small>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{mu2 ? `$${mu2.toFixed(2)}` : '...'}</div>
        </div>
        <div style={{ flex: 1, background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #f1c40f' }}>
          <small style={{ color: '#7f8c8d' }}>Geopolitical Events</small>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{eventMarkers.length}</div>
        </div>
      </div>

      {/* Main Analysis Chart */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', height: '500px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="Date" interval={Math.floor(data.length / 6)} tick={{fontSize: 12}} />
            <YAxis domain={['auto', 'auto']} tick={{fontSize: 12}} label={{ value: 'USD ($)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend verticalAlign="top" height={36}/>
            
            {/* 1. The Real Price Data */}
            <Line 
              name="Market Price"
              type="monotone" 
              dataKey="Price" 
              stroke="#2c3e50" 
              dot={false} 
              strokeWidth={1.5} 
              isAnimationActive={false} 
            />

            {/* 2. Visual: The Change Point (Vertical Line) */}
            {changeDate && (
              <ReferenceLine 
                x={changeDate} 
                stroke="red" 
                strokeWidth={2} 
                label={{ value: 'REGIME SHIFT', position: 'top', fill: 'red', fontSize: 12 }} 
              />
            )}

            {/* 3. Visual: Pre-Break Mean (Horizontal Line) */}
            {mu1 && changeDate && (
              <ReferenceLine 
                y={mu1} 
                stroke="blue" 
                strokeDasharray="5 5" 
                label={{ value: `μ1: $${mu1.toFixed(2)}`, fill: 'blue', position: 'insideBottomLeft' }}
                // This restricts the line to only the "Pre-Break" period
                segment={[{ x: data[0]?.Date, y: mu1 }, { x: changeDate, y: mu1 }]}
              />
            )}

            {/* 4. Visual: Post-Break Mean (Horizontal Line) */}
            {mu2 && changeDate && (
              <ReferenceLine 
                y={mu2} 
                stroke="green" 
                strokeDasharray="5 5" 
                label={{ value: `μ2: $${mu2.toFixed(2)}`, fill: 'green', position: 'insideTopRight' }}
                segment={[{ x: changeDate, y: mu2 }, { x: data[data.length - 1]?.Date, y: mu2 }]}
              />
            )}

            {/* 5. Geopolitical Event Highlights */}
            {eventMarkers.map((ev, i) => (
              <ReferenceLine 
                key={i} 
                x={ev.Date} 
                stroke="#f1c40f" 
                strokeOpacity={0.4} 
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <p style={{ marginTop: '15px', fontSize: '12px', color: '#95a5a6', textAlign: 'center' }}>
        Bayesian Inference Engine: PyMC Model | Data Sampling: 1/550 ratio
      </p>
    </div>
  );
};

export default App;
