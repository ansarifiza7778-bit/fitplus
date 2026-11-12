/* ================================================================
   FitPulse — pure logic + data (React port)
   Saara calculation yahan hai, components sirf render karte hain
   ================================================================ */

/* MET values: Compendium of Physical Activities */
export const ACT = {
  walking:  {name:'Walking',       icon:'🚶',  met:3.5,  hr:95,  spm:100, kpm:.083, color:'#22d3ee'},
  jogging:  {name:'Jogging',       icon:'🏃',  met:7.0,  hr:138, spm:150, kpm:.160, color:'#34d399'},
  running:  {name:'Running',       icon:'🏃‍♂️', met:9.8,  hr:155, spm:168, kpm:.200, color:'#a3e635'},
  badminton:{name:'Badminton',     icon:'🏸',  met:5.5,  hr:126, spm:75,  kpm:.045, color:'#f472b6'},
  gym:      {name:'Gym / Weights', icon:'🏋️', met:6.0,  hr:118, spm:35,  kpm:.020, color:'#fb923c'},
  cycling:  {name:'Cycling',       icon:'🚴',  met:7.5,  hr:130, spm:0,   kpm:.350, color:'#c084fc'},
  yoga:     {name:'Yoga',          icon:'🧘',  met:3.0,  hr:84,  spm:10,  kpm:.005, color:'#2dd4bf'},
  hiit:     {name:'HIIT',          icon:'🔥',  met:10.0, hr:158, spm:110, kpm:.090, color:'#f87171'},
  swimming: {name:'Swimming',      icon:'🏊',  met:8.3,  hr:140, spm:0,   kpm:.040, color:'#38bdf8'},
  cricket:  {name:'Cricket',       icon:'🏏',  met:5.0,  hr:108, spm:55,  kpm:.055, color:'#fbbf24'},
  football: {name:'Football',      icon:'⚽',  met:8.5,  hr:145, spm:90,  kpm:.150, color:'#4ade80'},
  dance:    {name:'Dance',         icon:'💃',  met:5.0,  hr:118, spm:85,  kpm:.070, color:'#e879f9'},
};

export const INT_MULT = { light:.8, moderate:1, intense:1.25 };
export const INT_HR   = { light:-8, moderate:0, intense:10 };
export const GOALS = { steps:10000, kcal:700, min:60, km:6, water:8 };

export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const pad=n=>String(n).padStart(2,'0');
export const fmt=n=>n.toLocaleString('en-IN');

/* deterministic RNG (mulberry32) — stable "realistic" data per date */
export function hash(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h);}
export function rngFrom(a){
  return function(){
    a|=0; a=(a+0x6D2B79F5)|0;
    let t=Math.imul(a^(a>>>15), 1|a);
    t=(t+Math.imul(t^(t>>>7), 61|t))^t;
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}
export const dayKey=(d=new Date())=>d.toISOString().slice(0,10);
export const nowMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes();};

/* ---------- physics ---------- */
export const kcalOf=(a,weight)=>ACT[a.type].met*3.5*weight/200*a.dur*INT_MULT[a.int];
export const stepsOf=a=>ACT[a.type].spm*a.dur*INT_MULT[a.int];
export const kmOf=a=>ACT[a.type].kpm*a.dur;
export const hrTarget=a=>ACT[a.type].hr+INT_HR[a.int];

export function totals(activities, weight){
  let steps=0,kcal=0,min=0,km=0; const perType={};
  for(const a of activities){
    const k=kcalOf(a,weight), s=stepsOf(a);
    kcal+=k; steps+=s; min+=a.dur;
    /* cycling/swimming ke alawa distance steps se aata hai (double-count na ho) */
    if(a.type==='cycling'||a.type==='swimming') km+=kmOf(a);
    perType[a.type]=perType[a.type]||{kcal:0,min:0};
    perType[a.type].kcal+=k; perType[a.type].min+=a.dur;
  }
  const r=rngFrom(hash(dayKey()));
  steps+=Math.round(2800+r()*1400);      /* ambient daily movement */
  km+=steps*.00075;
  return {steps:Math.round(steps), kcal:Math.round(kcal), min, km, perType};
}

/* ---------- heart-rate curve (24h, 15-min samples) ---------- */
const circadian=m=>62-Math.cos((m-240)/1440*2*Math.PI)*6;

export function heartCurve(activities){
  const pts=[]; const lim=nowMin();
  for(let m=0;m<=lim;m+=15){
    let hr=circadian(m);
    for(const a of activities){
      const [h,mm]=a.time.split(':').map(Number);
      const st=h*60+mm, en=st+a.dur;
      let t=0;
      if(m<st) t=Math.max(0,1-(st-m)/10);
      else if(m<=en) t=1;
      else t=Math.max(0,1-(m-en)/15);
      if(t>0){ const tg=hrTarget(a), e=t*t*(3-2*t); hr+=(tg-hr)*e; }
    }
    const r=rngFrom(hash(dayKey()+m))();
    pts.push({m, hr:Math.round(clamp(hr+(r*2-1)*3,50,185))});
  }
  if(!pts.length) pts.push({m:0,hr:Math.round(circadian(0))});
  return pts;
}

/* ---------- weekly data ---------- */
export function weekly(todayMin){
  const arr=[]; const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  for(let d=6;d>=0;d--){
    const dt=new Date(); dt.setDate(dt.getDate()-d);
    if(d===0) arr.push({lab:'Today', min:todayMin, today:true});
    else{
      const r=rngFrom(hash(dayKey(dt)));
      arr.push({lab:days[dt.getDay()], min:Math.round(35+r()*45), today:false});
    }
  }
  return arr;
}

export function streakOf(data){
  let streak=0;
  /* aaj complete nahi hua toh kal se ginna */
  const seq=(data[data.length-1].min>=30)?[...data].reverse():[...data].slice(0,-1).reverse();
  for(const d of seq){ if(d.min>=30)streak++; else break; }
  return streak;
}

/* ---------- localStorage ---------- */
const KEY='fitpulse_v1';

export function loadState(){
  try{
    const s=JSON.parse(localStorage.getItem(KEY));
    if(s && Array.isArray(s.activities)) return s;
  }catch{}
  return seedState();
}
export function saveState(s){
  try{ localStorage.setItem(KEY, JSON.stringify(s)); }catch{}
}
export function seedState(){
  const now=new Date(); const h=now.getHours()+now.getMinutes()/60;
  const acts=[];
  const push=(type,dur,time)=>{
    const [hh,mm]=time.split(':').map(Number);
    if(hh+mm/60<h) acts.push({id:type+time, type, dur, int:'moderate', time});
  };
  push('walking',35,'06:45');
  push('gym',55,'09:30');
  push('badminton',45,'17:30');
  push('walking',25,'20:30');
  if(!acts.length){ /* very early morning: ek halki session */
    const t=new Date(Date.now()-25*60000);
    acts.push({id:'seedYoga', type:'yoga', dur:15, int:'light',
      time:pad(t.getHours())+':'+pad(t.getMinutes())});
  }
  return { weight:70, water:Math.min(5,GOALS.water), activities:acts };
}
