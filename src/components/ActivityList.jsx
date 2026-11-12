import { ACT, kcalOf } from '../lib/health.js';

export default function ActivityList({activities, weight, onDelete, showToast}){
  const acts = [...activities].sort((a,b)=>b.time.localeCompare(a.time));

  return (
    <div className="card span7">
      <div className="card-head">
        <div><h3>🏃 Today's Activities</h3><div className="sub">Aaj kya-kya kiya</div></div>
        <span className="chip">{acts.length} session{acts.length===1 ? '' : 's'}</span>
      </div>

      <div className="alist">
        {acts.length ? acts.map((a,i)=>(
          <div className="a-row" key={a.id} style={{'--c': ACT[a.type].color, animationDelay: (i*.05)+'s'}}>
            <div className="a-ico">{ACT[a.type].icon}</div>
            <div className="a-info">
              <b>{ACT[a.type].name}</b>
              <span>{a.dur} min · {a.time} · {a.int}</span>
            </div>
            <div className="a-kcal">{Math.round(kcalOf(a, weight))} <small>kcal</small></div>
            <button className="a-del" onClick={()=>{ onDelete(a.id); showToast('Activity removed 🗑️'); }}>✕</button>
          </div>
        )) : (
          <div className="a-empty">Aaj koi activity nahi — pehla session log karo! 💪</div>
        )}
      </div>
    </div>
  );
}
