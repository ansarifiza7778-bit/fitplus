import { useState } from 'react';
import { ACT, kcalOf, stepsOf, hrTarget, fmt, pad } from '../lib/health.js';

export default function LogForm({weight, onAdd, showToast}){
  const [type, setType] = useState('walking');
  const [dur, setDur] = useState(30);
  const [int, setInt] = useState('moderate');
  const [time, setTime] = useState(()=>{
    const d = new Date();
    return pad(d.getHours())+':'+pad(d.getMinutes());
  });

  const sample = {type, dur:+dur || 0, int};
  const kcal = Math.round(kcalOf(sample, weight));
  const steps = fmt(Math.round(stepsOf(sample)));
  const bpm = Math.round(hrTarget(sample));

  const submit = e => {
    e.preventDefault();
    const d = Math.round(+dur);
    if(!d || d < 1){ showToast('Duration daalo pehle 😅'); return; }
    onAdd({id: Date.now()+''+Math.floor(Math.random()*999), type, dur: d, int, time: time || '12:00'});
    showToast(`${ACT[type].icon} ${ACT[type].name} logged — ${Math.round(kcalOf({type, dur:d, int}, weight))} kcal 🔥`);
  };

  return (
    <div className="card span5">
      <div className="card-head">
        <div><h3>➕ Log Activity</h3><div className="sub">Realistic MET-based calorie calc</div></div>
      </div>
      <form onSubmit={submit}>
        <label className="f">Activity</label>
        <select value={type} onChange={e=>setType(e.target.value)} style={{marginBottom:12}}>
          {Object.entries(ACT).map(([k,v])=> <option key={k} value={k}>{v.icon} {v.name}</option>)}
        </select>

        <div className="form-row">
          <div>
            <label className="f">Duration (min)</label>
            <input type="number" min="1" max="300" value={dur} onChange={e=>setDur(e.target.value)}/>
          </div>
          <div>
            <label className="f">Time of day</label>
            <input type="time" value={time} onChange={e=>setTime(e.target.value)}/>
          </div>
        </div>

        <div className="chips" style={{marginBottom:14}}>
          {[15,30,45,60,90].map(d=>(
            <span key={d} className={'chipbtn'+(+dur===d ? ' on' : '')} onClick={()=>setDur(d)}>{d}m</span>
          ))}
        </div>

        <label className="f">Intensity</label>
        <div className="seg">
          {[['light','😌 Light'],['moderate','💪 Moderate'],['intense','🔥 Intense']].map(([k,lab])=>(
            <span key={k} className={'chipbtn'+(int===k ? ' on' : '')} onClick={()=>setInt(k)}>{lab}</span>
          ))}
        </div>

        <button className="btn-main" type="submit">⚡ Add to Today</button>
        <div className="form-note">≈ {kcal} kcal · {steps} steps · ~{bpm} bpm avg</div>
      </form>
    </div>
  );
}
