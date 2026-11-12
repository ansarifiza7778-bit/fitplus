import { useMemo, useRef, useEffect } from 'react';

export default function HeartChart({curve, bpm}){
  /* geometry — curve change hone pe hi recompute */
  const geo = useMemo(()=>{
    const W=620, H=220, T=16, B=196, L=34, Rr=606;
    const xFor = m => L + (m/1440)*(Rr-L);
    const yFor = v => B - (Math.max(50, Math.min(175, v)) - 50)/(175-50)*(B-T);
    const P = curve.map(p=>[xFor(p.m), yFor(p.hr)]);

    let line = '';
    if(P.length > 1){
      line = `M ${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
      for(let i=1; i<P.length; i++){
        const [x0,y0]=P[i-1], [x1,y1]=P[i], mx=(x0+x1)/2;
        line += ` C ${mx.toFixed(1)},${y0.toFixed(1)} ${mx.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
      }
    }
    const area = line + ` L ${P[P.length-1][0].toFixed(1)},${B} L ${P[0][0].toFixed(1)},${B} Z`;

    const grid = [60,80,100,120,140,160].map(v=>({v, y: yFor(v)}));
    const hours = [...Array(8)].map((_,i)=>{
      const h = i*3;
      return {x: xFor(h*60), lab: h===0?'12a' : h===12?'12p' : h<12 ? h+'a' : (h-12)+'p'};
    });

    const hrs = curve.map(p=>p.hr);
    return {
      W, H, T, B, L, Rr, yFor, line, area, grid, hours,
      last: P[P.length-1],
      rest: Math.min(...hrs),
      max: Math.max(...hrs),
      avg: Math.round(hrs.reduce((a,b)=>a+b, 0)/hrs.length),
      fat: hrs.filter(v=>v>=100 && v<120).length*15,
      cardio: hrs.filter(v=>v>=120).length*15,
    };
  }, [curve]);

  /* draw-in animation — line khud ko reveal karta hai */
  const lineRef = useRef(null);
  useEffect(()=>{
    const el = lineRef.current;
    if(!el) return;
    const len = el.getTotalLength();
    el.style.transition = 'none';
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len;
    el.getBoundingClientRect();
    el.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.4,0,.2,1)';
    el.style.strokeDashoffset = 0;
  }, [geo]);

  return (
    <div className="card span7">
      <div className="card-head">
        <div><h3>💓 Heart Rate — Live</h3><div className="sub">Last 24 hours · 15-min samples</div></div>
        <span className="chip">● {bpm} bpm now</span>
      </div>

      <svg id="heartSvg" viewBox="0 0 620 220">
        <defs>
          <linearGradient id="hg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#22d3ee"/>
            <stop offset=".55" stopColor="#a78bfa"/>
            <stop offset="1" stopColor="#fb7185"/>
          </linearGradient>
          <linearGradient id="ha" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a78bfa" stopOpacity=".35"/>
            <stop offset="1" stopColor="#a78bfa" stopOpacity="0"/>
          </linearGradient>
        </defs>

        {geo.grid.map(g=>(
          <g key={g.v}>
            <line x1={geo.L} y1={g.y} x2={geo.Rr} y2={g.y} stroke="rgba(255,255,255,.06)"/>
            <text x={geo.L-6} y={g.y+3} fill="#5c6482" fontSize="9" textAnchor="end">{g.v}</text>
          </g>
        ))}
        {geo.hours.map(h=>(
          <text key={h.lab} x={h.x} y={220-4} fill="#5c6482" fontSize="9" textAnchor="middle">{h.lab}</text>
        ))}

        {/* fat-burn / cardio zone tint */}
        <rect x={geo.L} y={geo.yFor(140)} width={geo.Rr-geo.L} height={geo.yFor(120)-geo.yFor(140)} fill="rgba(251,113,133,.06)"/>
        <rect x={geo.L} y={geo.yFor(120)} width={geo.Rr-geo.L} height={geo.yFor(100)-geo.yFor(120)} fill="rgba(251,191,36,.05)"/>

        <path d={geo.area} fill="url(#ha)"/>
        <path ref={lineRef} d={geo.line} fill="none" stroke="url(#hg)" strokeWidth="2.6" strokeLinecap="round"
          style={{filter: 'drop-shadow(0 4px 10px rgba(167,139,250,.4))'}}/>

        {/* now marker */}
        <line x1={geo.last[0]} y1={geo.T} x2={geo.last[0]} y2={geo.B} stroke="rgba(255,255,255,.14)" strokeDasharray="3 4"/>
        <circle cx={geo.last[0]} cy={geo.last[1]} r="4.5" fill="#f43f5e">
          <animate attributeName="r" values="4;6.5;4" dur="1.2s" repeatCount="indefinite"/>
        </circle>
        <circle cx={geo.last[0]} cy={geo.last[1]} r="9" fill="none" stroke="#f43f5e" strokeOpacity=".4">
          <animate attributeName="r" values="6;13" dur="1.2s" repeatCount="indefinite"/>
          <animate attributeName="stroke-opacity" values=".5;0" dur="1.2s" repeatCount="indefinite"/>
        </circle>
      </svg>

      <div className="hr-meta">
        <div>Resting <b>{geo.rest} bpm</b></div>
        <div>Average <b>{geo.avg} bpm</b></div>
        <div>Max <b>{geo.max} bpm</b></div>
        <div>Fat burn <b style={{color:'#fbbf24'}}>{geo.fat} min</b></div>
        <div>Cardio <b style={{color:'#fb7185'}}>{geo.cardio} min</b></div>
      </div>
    </div>
  );
}
