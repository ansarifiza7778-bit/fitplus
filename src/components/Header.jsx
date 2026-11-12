import { useState } from 'react';

export default function Header({streak, weight, setWeight, onReset, showToast}){
  const [d] = useState(new Date());

  return (
    <header>
      <div className="logo">
        <div className="logo-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" fill="rgba(255,255,255,.15)"/>
            <path d="M3.5 12h4l1.5-3 3 6 1.5-3h4" strokeWidth="1.8"/>
          </svg>
        </div>
        <div>
          <h1>Fit<span>Pulse</span></h1>
          <small>HEALTH · ACTIVITY · LIVE</small>
        </div>
      </div>
      <span className="chip">🔥 {streak}-day streak</span>
      <select className="chip" value={weight} onChange={e=>setWeight(e.target.value)} title="Body weight">
        {[55,60,65,70,75,80,85,90].map(w => <option key={w} value={w}>⚖️ {w} kg</option>)}
      </select>
      <span className="chip">📅 {d.toLocaleDateString('en-IN', {weekday:'short', day:'numeric', month:'short'})}</span>
      <button className="chip btn-ghost" onClick={()=>{
        if(confirm('Aaj ka saara data reset karna hai?')){ onReset(); showToast('Day reset ho gaya ↺'); }
      }}>↺ Reset Day</button>
    </header>
  );
}
