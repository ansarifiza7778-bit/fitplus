import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { loadState, saveState, totals, heartCurve, weekly, streakOf, clamp } from './lib/health.js';
import Header from './components/Header.jsx';
import StatCards from './components/StatCards.jsx';
import DonutChart from './components/DonutChart.jsx';
import HeartChart from './components/HeartChart.jsx';
import LogForm from './components/LogForm.jsx';
import WeeklyChart from './components/WeeklyChart.jsx';
import ActivityList from './components/ActivityList.jsx';
import GoalsCard from './components/GoalsCard.jsx';

/* live BPM simulation — thoda random fluctuation, realistic feel */
function useLiveBpm(curve){
  const base = curve[curve.length-1].hr;
  const [bpm, setBpm] = useState(base);
  useEffect(()=>{ setBpm(base); }, [base]);
  useEffect(()=>{
    const iv = setInterval(()=>{
      setBpm(b => clamp(b + Math.round((Math.random()*2-1)*2.2), base-4, base+4));
    }, 1600);
    return ()=>clearInterval(iv);
  }, [base]);
  return bpm;
}

export default function App(){
  const [state, setState] = useState(loadState);
  const [toast, setToast] = useState(null);
  const timer = useRef();

  useEffect(()=>{ saveState(state); }, [state]);

  const showToast = useCallback((msg)=>{
    setToast({msg});
    clearTimeout(timer.current);
    timer.current = setTimeout(()=>setToast(null), 2600);
  }, []);

  /* derived data — sirf activities/weight change pe recalculate */
  const t = useMemo(()=>totals(state.activities, state.weight), [state.activities, state.weight]);
  const curve = useMemo(()=>heartCurve(state.activities), [state.activities]);
  const week = useMemo(()=>weekly(t.min), [t.min]);
  const streak = useMemo(()=>streakOf(week), [week]);
  const bpm = useLiveBpm(curve);

  const addActivity = a => setState(s => ({...s, activities:[...s.activities, a]}));
  const delActivity = id => setState(s => ({...s, activities: s.activities.filter(x=>x.id!==id)}));
  const setWeight = w => setState(s => ({...s, weight:+w}));
  const setWater = n => setState(s => ({...s, water:n}));
  const resetDay = () => setState(s => ({...s, activities:[], water:0}));

  const h = new Date().getHours();
  const greet = h<5 ? 'Late night grind 🌙' : h<12 ? 'Good Morning' : h<17 ? 'Good Afternoon' : h<21 ? 'Good Evening' : 'Good Night';

  return (
    <>
      <div className="orb o1"/><div className="orb o2"/><div className="orb o3"/>
      <div className="wrap">
        <Header streak={streak} weight={state.weight} setWeight={setWeight} onReset={resetDay} showToast={showToast}/>
        <div className="greet">
          <h2>{greet}, Champ <em>💪</em></h2>
          <p>Yeh raha aaj ka health snapshot — real-time data ke saath.</p>
        </div>
        <StatCards t={t} curve={curve} bpm={bpm}/>
        <div className="grid">
          <DonutChart t={t}/>
          <HeartChart curve={curve} bpm={bpm}/>
          <LogForm weight={state.weight} onAdd={addActivity} showToast={showToast}/>
          <WeeklyChart week={week}/>
          <ActivityList activities={state.activities} weight={state.weight} onDelete={delActivity} showToast={showToast}/>
          <GoalsCard t={t} water={state.water} setWater={setWater}/>
        </div>
      </div>
      <div id="toast" className={toast ? 'show' : ''}>{toast?.msg || ''}</div>
    </>
  );
}
