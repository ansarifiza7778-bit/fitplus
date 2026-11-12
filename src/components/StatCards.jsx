import { useState, useEffect, useRef } from 'react';
import { GOALS, fmt, clamp } from '../lib/health.js';

/* number ticker — value smoothly count-up karta hai */
function AnimatedNumber({value, format = fmt}){
  const [val, setVal] = useState(0);
  const fromRef = useRef(0);

  useEffect(()=>{
    /* rAF background/occluded tab mein fire nahi hota — interval + performance.now()
       har jagah kaam karta hai (background mein throttle hoke bhi final value tak pahunchta hai) */
    const from = fromRef.current, t0 = performance.now(), dur = 900;
    const iv = setInterval(()=>{
      const p = Math.min(1, (performance.now()-t0)/dur), e = 1-Math.pow(1-p, 3);
      setVal(Math.round(from + (value-from)*e));
      if(p >= 1){ clearInterval(iv); fromRef.current = value; }
    }, 16);
    return ()=>clearInterval(iv);
  }, [value]);

  return format(val);
}

export default function StatCards({t, curve, bpm}){
  const rest = Math.min(...curve.map(p=>p.hr));

  return (
    <div className="stats">
      <div className="card stat" style={{'--a':'#22d3ee','--b':'#0ea5e9','--glow':'rgba(34,211,238,.35)'}}>
        <div className="stat-top"><span className="stat-ico">👟</span><span className="trend up">+8%</span></div>
        <div className="stat-val"><AnimatedNumber value={t.steps}/></div>
        <div className="stat-lbl">Steps</div>
        <div className="bar"><i style={{width: clamp(t.steps/GOALS.steps*100, 0, 100)+'%'}}/></div>
        <div className="stat-sub">Goal {fmt(GOALS.steps)} · {Math.round(t.steps/GOALS.steps*100)}%</div>
      </div>

      <div className="card stat" style={{'--a':'#fb923c','--b':'#f43f5e','--glow':'rgba(251,146,60,.35)'}}>
        <div className="stat-top"><span className="stat-ico">🔥</span><span className="trend up">+12%</span></div>
        <div className="stat-val"><AnimatedNumber value={t.kcal}/> <small>kcal</small></div>
        <div className="stat-lbl">Calories Burned</div>
        <div className="bar"><i style={{width: clamp(t.kcal/GOALS.kcal*100, 0, 100)+'%'}}/></div>
        <div className="stat-sub">Active burn · goal {GOALS.kcal} kcal</div>
      </div>

      <div className="card stat" style={{'--a':'#f43f5e','--b':'#a78bfa','--glow':'rgba(244,63,94,.35)'}}>
        <div className="stat-top"><span className="stat-ico">❤️</span><span className="trend up">LIVE</span></div>
        <div className="stat-val"><span className="live-dot"/>{bpm} <small>bpm</small></div>
        <div className="stat-lbl">Heart Rate</div>
        <div className="bar"><i style={{width: clamp((bpm-50)/(185-50)*100, 0, 100)+'%'}}/></div>
        <div className="stat-sub">Resting {rest} bpm</div>
      </div>

      <div className="card stat" style={{'--a':'#34d399','--b':'#10b981','--glow':'rgba(52,211,153,.35)'}}>
        <div className="stat-top"><span className="stat-ico">⏱️</span><span className="trend up">+5%</span></div>
        <div className="stat-val"><AnimatedNumber value={t.min}/> <small>min</small></div>
        <div className="stat-lbl">Active Time</div>
        <div className="bar"><i style={{width: clamp(t.min/GOALS.min*100, 0, 100)+'%'}}/></div>
        <div className="stat-sub">{t.min >= GOALS.min ? 'Goal smashed! 🎉' : `${GOALS.min - t.min} min to goal`}</div>
      </div>

      <div className="card stat" style={{'--a':'#a78bfa','--b':'#7c3aed','--glow':'rgba(167,139,250,.35)'}}>
        <div className="stat-top"><span className="stat-ico">📍</span><span className="trend up">+9%</span></div>
        <div className="stat-val"><AnimatedNumber value={t.km} format={v=>v.toFixed(1)}/> <small>km</small></div>
        <div className="stat-lbl">Distance</div>
        <div className="bar"><i style={{width: clamp(t.km/GOALS.km*100, 0, 100)+'%'}}/></div>
        <div className="stat-sub">≈ {fmt(t.steps)} steps today</div>
      </div>
    </div>
  );
}
