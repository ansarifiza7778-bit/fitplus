import { GOALS, fmt, clamp } from '../lib/health.js';

function GoalRow({icon, label, val, goal, unit, pct, color}){
  return (
    <div className="goal-row">
      <span className="g-ico">{icon}</span>
      <div className="goal-info">
        <div className="gt"><span>{label}</span><i>{val} / {goal} {unit}</i></div>
        <div className="bar">
          <i style={{width: clamp(pct, 0, 100)+'%', background: `linear-gradient(90deg, ${color}, ${color})`}}/>
        </div>
      </div>
    </div>
  );
}

export default function GoalsCard({t, water, setWater}){
  return (
    <div className="card span5">
      <div className="card-head">
        <div><h3>🎯 Daily Goals</h3><div className="sub">Tap glass to log water</div></div>
      </div>

      <div className="goal-list">
        <GoalRow icon="👟" label="Steps" val={fmt(t.steps)} goal={fmt(GOALS.steps)} unit="" pct={t.steps/GOALS.steps*100} color="#22d3ee"/>
        <GoalRow icon="🔥" label="Calories" val={fmt(t.kcal)} goal={GOALS.kcal} unit="kcal" pct={t.kcal/GOALS.kcal*100} color="#fb923c"/>
        <GoalRow icon="⏱️" label="Active minutes" val={t.min} goal={GOALS.min} unit="min" pct={t.min/GOALS.min*100} color="#34d399"/>
        <GoalRow icon="📍" label="Distance" val={t.km.toFixed(1)} goal={GOALS.km} unit="km" pct={t.km/GOALS.km*100} color="#a78bfa"/>
      </div>

      <h3 style={{fontSize:'.85rem', marginBottom:10}}>💧 Hydration</h3>
      <div className="water">
        {[...Array(GOALS.water)].map((_,i)=>{
          const n = i+1;
          return (
            <span key={n} className={'cup'+(n<=water ? ' full' : '')}
              onClick={()=>setWater(water===n && n===1 ? 0 : n)}>🥤</span>
          );
        })}
        <div className="water-sub">
          {water}/{GOALS.water} glasses · {(water*.25).toFixed(2)} L {water >= GOALS.water ? '— fully hydrated ✅' : ''}
        </div>
      </div>
    </div>
  );
}
