import { useState, useMemo } from 'react';
import { ACT, fmt } from '../lib/health.js';

function polar(cx, cy, r, deg){
  const a = (deg-90)*Math.PI/180;
  return [cx + r*Math.cos(a), cy + r*Math.sin(a)];
}
function segPath(cx, cy, R, r, a0, a1){
  const large = (a1-a0) > 180 ? 1 : 0;
  const [x0,y0] = polar(cx,cy,R,a0), [x1,y1] = polar(cx,cy,R,a1);
  const [x2,y2] = polar(cx,cy,r,a1), [x3,y3] = polar(cx,cy,r,a0);
  return `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${r} ${r} 0 ${large} 0 ${x3} ${y3} Z`;
}

export default function DonutChart({t}){
  const [hover, setHover] = useState(null); /* {type, x, y} */

  const entries = useMemo(
    ()=>Object.entries(t.perType).sort((a,b)=>b[1].kcal - a[1].kcal),
    [t]
  );
  const total = entries.reduce((s,[,v])=>s+v.kcal, 0);

  const cx=120, cy=120, R=96, r=62, GAP=3;
  let acc = 0;
  const segments = entries.map(([type, v], i)=>{
    const span = v.kcal/total*360;
    const a0 = acc + (entries.length>1 ? GAP/2 : 0);
    const a1 = acc + span - (entries.length>1 ? GAP/2 : 0);
    acc += span;
    const mid = (a0+a1)/2, rad = (mid-90)*Math.PI/180;
    return {
      type, i,
      d: segPath(cx, cy, R, r, Math.max(.1, a0), Math.max(a0+.2, a1)),
      tx: (Math.cos(rad)*7).toFixed(1),
      ty: (Math.sin(rad)*7).toFixed(1),
    };
  });

  return (
    <div className="card span5">
      <div className="card-head">
        <div><h3>🥧 Aaj ka Activity Mix</h3><div className="sub">Calories by activity</div></div>
        <span className="chip">{t.min} active min</span>
      </div>

      <div className="donut-wrap">
        {entries.length ? (
          <svg id="donut" viewBox="0 0 240 240" width="100%" style={{maxWidth: 250}}>
            {segments.map(s=>(
              <path key={s.type} d={s.d} fill={ACT[s.type].color}
                className={hover && hover.type!==s.type ? 'dim' : ''}
                style={{'--tx': s.tx+'px', '--ty': s.ty+'px', animationDelay: (.1+s.i*.08)+'s'}}
                onMouseEnter={e=>setHover({type: s.type, x: e.clientX+14, y: e.clientY-10})}
                onMouseMove={e=>setHover({type: s.type, x: e.clientX+14, y: e.clientY-10})}
                onMouseLeave={()=>setHover(null)}
              />
            ))}
          </svg>
        ) : (
          <svg id="donut" className="empty-ring" viewBox="0 0 240 240" width="100%" style={{maxWidth: 250}}>
            <circle cx="120" cy="120" r="88" fill="none" strokeWidth="34"/>
            <circle cx="120" cy="120" r="66" fill="none" strokeWidth="34"/>
          </svg>
        )}
        <div className="donut-center"><b>{fmt(t.kcal)}</b><span>kcal burned</span></div>
      </div>

      <div className="legend">
        {entries.length ? entries.map(([type, v])=>(
          <div className="lg-row" key={type}>
            <span className="lg-dot" style={{background: ACT[type].color}}/>
            <span className="lg-name">{ACT[type].icon} {ACT[type].name}</span>
            <span className="lg-val">{Math.round(v.kcal)} kcal · {v.min}m</span>
            <span className="lg-pct" style={{color: ACT[type].color}}>{Math.round(v.kcal/total*100)}%</span>
          </div>
        )) : (
          <div className="a-empty">Aaj kuch log nahi kiya abhi 📝<br/>Neeche se activity add karo!</div>
        )}
      </div>

      <div id="tooltip" style={{opacity: hover?1:0, left: hover?.x||0, top: hover?.y||0}}>
        {hover && t.perType[hover.type] && (
          <>
            {ACT[hover.type].icon} <b>{ACT[hover.type].name}</b>
            {' '}— {Math.round(t.perType[hover.type].kcal)} kcal · {t.perType[hover.type].min} min
            {' '}({Math.round(t.perType[hover.type].kcal/total*100)}%)
          </>
        )}
      </div>
    </div>
  );
}
