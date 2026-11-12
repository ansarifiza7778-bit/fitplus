import { GOALS, fmt } from '../lib/health.js';

export default function WeeklyChart({week}){
  const W=620, H=210, B=176, T=22, L=10;
  const max = Math.max(...week.map(d=>d.min), GOALS.min)*1.15;
  const bw = 46, gap = (W - L*2 - 7*bw)/6;
  const gy = B - (GOALS.min/max)*(B-T);
  const totMin = week.reduce((s,d)=>s+d.min, 0);

  return (
    <div className="card span7">
      <div className="card-head">
        <div><h3>📊 Is Hafte ka Score</h3><div className="sub">Active minutes per day</div></div>
        <span className="chip">{totMin} min · {fmt(Math.round(totMin*6.5))} kcal</span>
      </div>

      <svg id="weekSvg" viewBox="0 0 620 210">
        <defs>
          <linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#818cf8"/>
            <stop offset="1" stopColor="#6366f1" stopOpacity=".35"/>
          </linearGradient>
          <linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fb923c"/>
            <stop offset="1" stopColor="#f43f5e"/>
          </linearGradient>
        </defs>

        {/* goal line */}
        <line x1={L} y1={gy} x2={W-10} y2={gy} stroke="rgba(52,211,153,.5)" strokeDasharray="5 5"/>
        <text x={W-12} y={gy-6} fill="#34d399" fontSize="10" textAnchor="end" fontWeight="700">🎯 60m goal</text>

        {week.map((d,i)=>{
          const x = L + i*(bw+gap);
          const h = (d.min/max)*(B-T);
          const y = B - h;
          return (
            <g key={i} className="bar-g">
              <rect x={x} y={y} width={bw} height={h} rx="11"
                fill={d.today ? 'url(#bg2)' : 'url(#bg1)'}
                style={{animationDelay: (i*.07)+'s',
                        ...(d.today ? {filter:'drop-shadow(0 6px 16px rgba(251,146,60,.45))'} : {})}}/>
              <text x={x+bw/2} y={y-8} textAnchor="middle" fontSize="11" fontWeight="800"
                fill={d.today ? '#fdba74' : '#a5b0cf'}>{d.min}m</text>
              <text x={x+bw/2} y={H-8} textAnchor="middle" fontSize="11" fontWeight={d.today ? 800 : 600}
                fill={d.today ? '#fff' : '#5c6482'}>{d.lab}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
