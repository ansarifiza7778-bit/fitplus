/* Good Night 10s animated GIF — pure Node, koi library nahi
   Night sky + twinkling stars + crescent moon + shooting stars
   + "GOOD NIGHT" + tricolor credit: Made in Bharat by Fiza Ansari */
import fs from 'node:fs';

/* ---------------- GIF encoder ---------------- */
class BitW{
  constructor(){ this.b=[]; this.cur=0; this.n=0; }
  write(code,size){ for(let i=0;i<size;i++){ this.cur |= ((code>>i)&1)<<this.n; if(++this.n===8){ this.b.push(this.cur); this.cur=0; this.n=0; } } }
  flush(){ if(this.n>0) this.b.push(this.cur); return new Uint8Array(this.b); }
}
function lzwEncode(minSize, data){
  const clear=1<<minSize, eoi=clear+1;
  let size=minSize+1, next=eoi+1, dict=new Map();
  const bw=new BitW();
  const reset=()=>{ dict=new Map(); next=eoi+1; size=minSize+1; };
  reset(); bw.write(clear,size);
  let w=data[0];
  for(let i=1;i<data.length;i++){
    const px=data[i], key=(w<<8)|px, hit=dict.get(key);
    if(hit!==undefined){ w=hit; }
    else{
      bw.write(w,size);
      dict.set(key,next++);
      if(next===(1<<size) && size<12) size++;
      if(next===4096){ bw.write(clear,size); reset(); }
      w=px;
    }
  }
  bw.write(w,size); bw.write(eoi,size);
  return bw.flush();
}
function subBlocks(bytes){
  const out=[];
  for(let i=0;i<bytes.length;i+=255){
    const n=Math.min(255, bytes.length-i);
    out.push(n, ...bytes.slice(i,i+n));
  }
  out.push(0);
  return Buffer.from(out);
}
function u16le(v){ return [v&255, (v>>8)&255]; }

/* ---------------- scene config ---------------- */
const W=480, H=300, FPS=10, SECS=10, FRAMES=FPS*SECS;

/* shared 64-color palette */
const PAL=[];
/* 0..23 sky gradient: #05070f -> #141438 -> #2b1e63 */
for(let i=0;i<24;i++){
  const t=i/23;
  let a=[5,7,15], b=[20,20,56], c=[43,30,99];
  const mix=(p,q,k)=>Math.round(p+(q-p)*k);
  const col = t<.5 ? [mix(a[0],b[0],t*2),mix(a[1],b[1],t*2),mix(a[2],b[2],t*2)]
                   : [mix(b[0],c[0],(t-.5)*2),mix(b[1],c[1],(t-.5)*2),mix(b[2],c[2],(t-.5)*2)];
  PAL.push(col);
}
/* index 24.. : stars, moon, text, tricolor */
PAL.push([125,140,201]);  // 24 star dim
PAL.push([185,196,242]);  // 25 star mid
PAL.push([255,255,255]);  // 26 white (star/text)
PAL.push([247,237,208]);  // 27 moon body
PAL.push([58,61,99]);     // 28 glow far
PAL.push([86,90,134]);    // 29 glow near
PAL.push([201,210,255]);  // 30 text soft
PAL.push([143,157,216]);  // 31 text shadow
PAL.push([255,153,51]);   // 32 saffron
PAL.push([19,136,8]);     // 33 green
const GRAD_N=24, STAR_DIM=24, STAR_MID=25, WHITE=26, MOON=27,
      GLOW_FAR=28, GLOW_NEAR=29, TXT_SOFT=30, TXT_SH=31, SAFFRON=32, GREEN=33;

/* ---------------- 5x7 pixel font (needed letters only) ---------------- */
const FONT={
  A:[0b01110,0b10001,0b10001,0b11111,0b10001,0b10001,0b10001],
  B:[0b11110,0b10001,0b10001,0b11110,0b10001,0b10001,0b11110],
  D:[0b11110,0b10001,0b10001,0b10001,0b10001,0b10001,0b11110],
  E:[0b11111,0b10000,0b10000,0b11110,0b10000,0b10000,0b11111],
  F:[0b11111,0b10000,0b10000,0b11110,0b10000,0b10000,0b10000],
  G:[0b01110,0b10001,0b10000,0b10111,0b10001,0b10001,0b01111],
  H:[0b10001,0b10001,0b10001,0b11111,0b10001,0b10001,0b10001],
  I:[0b01110,0b00100,0b00100,0b00100,0b00100,0b00100,0b01110],
  M:[0b10001,0b11011,0b10101,0b10101,0b10001,0b10001,0b10001],
  N:[0b10001,0b11001,0b10101,0b10011,0b10001,0b10001,0b10001],
  O:[0b01110,0b10001,0b10001,0b10001,0b10001,0b10001,0b01110],
  R:[0b11110,0b10001,0b10001,0b11110,0b10100,0b10010,0b10001],
  S:[0b01111,0b10000,0b10000,0b01110,0b00001,0b00001,0b11110],
  T:[0b11111,0b00100,0b00100,0b00100,0b00100,0b00100,0b00100],
  Y:[0b10001,0b10001,0b01010,0b00100,0b00100,0b00100,0b00100],
  Z:[0b11111,0b00001,0b00010,0b00100,0b01000,0b10000,0b11111],
};
function textWidth(str, sc){ return (str.length*6-1)*sc; }
function drawText(px, str, x0, y0, sc, color){
  let x=x0;
  for(const ch of str){
    const pat=FONT[ch];
    if(pat){
      for(let r=0;r<7;r++) for(let c=0;c<5;c++){
        if(pat[r] & (16>>c)){
          for(let sy=0;sy<sc;sy++) for(let sx=0;sx<sc;sx++){
            const X=x+c*sc+sx, Y=y0+r*sc+sy;
            if(X>=0&&X<W&&Y>=0&&Y<H) px[Y*W+X]=color;
          }
        }
      }
    }
    x+=6*sc;
  }
}

/* ---------------- static scene data ---------------- */
/* seeded rng — mulberry32 */
function rngFrom(a){ return function(){ a|=0; a=(a+0x6D2B79F5)|0; let t=Math.imul(a^(a>>>15),1|a); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
const rng=rngFrom(20261112);
const MX=395, MY=58, MR=26; /* moon */
const stars=[];
for(let i=0;i<90;i++){
  const x=Math.floor(rng()*W), y=Math.floor(rng()*H);
  if(Math.hypot(x-MX,y-MY)<MR+14) continue; /* moon ke paas nahi */
  stars.push({x,y, ph:rng(), rate:[1,2,3][Math.floor(rng()*3)]});
}
const MAIN_TXT='GOOD NIGHT', CREDIT=['MADE IN ','BHARAT',' BY FIZA ANSARI'];
const skyIdx=y=>Math.min(GRAD_N-1, Math.floor(y/H*GRAD_N));

/* shooting stars: [t0, x0, y0, dx, dy] — loop ke seam se door */
const shooters=[
  {t0:3.0, x0:60,  y0:38, dx: 1.0, dy:0.45},
  {t0:6.5, x0:300, y0:18, dx: 0.85,dy:0.50},
];

/* ---------------- frame renderer ---------------- */
function render(f){
  const t=f/FRAMES*SECS;
  const px=new Uint8Array(W*H);
  /* sky */
  for(let y=0;y<H;y++){ const c=skyIdx(y); px.fill(c, y*W, y*W+W); }

  /* stars twinkle — integer rates => seamless loop */
  for(const s of stars){
    const b=0.5+0.5*Math.sin(2*Math.PI*(s.rate*t/SECS + s.ph));
    if(b>0.88){ /* bright: chhota cross */
      px[s.y*W+s.x]=WHITE;
      if(s.x>0)px[s.y*W+s.x-1]=STAR_MID; if(s.x<W-1)px[s.y*W+s.x+1]=STAR_MID;
      if(s.y>0)px[(s.y-1)*W+s.x]=STAR_MID; if(s.y<H-1)px[(s.y+1)*W+s.x]=STAR_MID;
    } else if(b>0.42){ px[s.y*W+s.x]=STAR_MID; }
    else{ px[s.y*W+s.x]=STAR_DIM; }
  }

  /* shooting stars */
  for(const s of shooters){
    const p=(t-s.t0)/0.8;
    if(p>=0 && p<=1){
      const hx=Math.round(s.x0+p*250), hy=Math.round(s.y0+p*115);
      for(let k=0;k<14;k++){
        const X=Math.round(hx-s.dx*k*2.4), Y=Math.round(hy-s.dy*k*2.4);
        if(X<0||X>=W||Y<0||Y>=H) continue;
        px[Y*W+X]= k<2?WHITE : k<6?STAR_MID : STAR_DIM;
      }
    }
  }

  /* moon glow (pulse) + crescent */
  const gp=0.5+0.5*Math.sin(2*Math.PI*t/SECS);
  for(let y=Math.max(0,MY-38);y<Math.min(H,MY+38);y++)
    for(let x=Math.max(0,MX-38);x<Math.min(W,MX+38);x++){
      const d=Math.hypot(x-MX,y-MY);
      if(d>MR+2 && d<=MR+6) px[y*W+x]= gp>0.5?GLOW_NEAR:GLOW_FAR;
      else if(d>MR+6 && d<=MR+11) px[y*W+x]=GLOW_FAR;
    }
  const cutX=MX+9, cutY=MY-8, cutR=MR-3;
  for(let y=MY-MR;y<=MY+MR;y++)
    for(let x=MX-MR;x<=MX+MR;x++){
      if(x<0||x>=W||y<0||y>=H) continue;
      if(Math.hypot(x-MX,y-MY)<=MR){
        px[y*W+x]= Math.hypot(x-cutX,y-cutY)<=cutR ? skyIdx(y) : MOON;
      }
    }

  /* GOOD NIGHT — shadow + pulse */
  const tw=0.5+0.5*Math.sin(2*Math.PI*2*t/SECS);
  const mainW=textWidth(MAIN_TXT,5), mx0=Math.floor((W-mainW)/2);
  drawText(px, MAIN_TXT, mx0+4, 154, 5, TXT_SH);
  drawText(px, MAIN_TXT, mx0, 150, 5, tw>0.5?WHITE:TXT_SOFT);

  /* credit: MADE IN [BHARAT tricolor] BY FIZA ANSARI */
  const creditW=textWidth(CREDIT.join(''),2), cx0=Math.floor((W-creditW)/2);
  const cy0=232;
  drawText(px, CREDIT[0], cx0, cy0, 2, WHITE);
  drawText(px, CREDIT[1], cx0+CREDIT[0].length*6*2, cy0, 2, SAFFRON);
  /* BHARAT ko tirange mein: har letter alag color */
  const bx=cx0+CREDIT[0].length*6*2;
  const tri=[SAFFRON,WHITE,GREEN];
  let lx=bx;
  for(let i=0;i<CREDIT[1].length;i++){
    drawText(px, CREDIT[1][i], lx, cy0, 2, tri[i%3]);
    lx+=6*2;
  }
  drawText(px, CREDIT[2], bx+CREDIT[1].length*6*2, cy0, 2, WHITE);

  return px;
}

/* ---------------- assemble GIF ---------------- */
const gif=[];
gif.push(...[0x47,0x49,0x46,0x38,0x39,0x61]);          // GIF89a
gif.push(...u16le(W), ...u16le(H));
gif.push(0xF5, 0, 0);                                  // GCT 64 colors, bg 0
for(const c of PAL){ gif.push(c[0],c[1],c[2]); }       // 64 entries
/* NETSCAPE loop forever */
gif.push(0x21,0xFF,0x0B, ...Buffer.from('NETSCAPE2.0'), 0x03,0x01, ...u16le(0), 0x00);

for(let f=0; f<FRAMES; f++){
  gif.push(0x21,0xF9,0x04, 0x04, ...u16le(10), 0x00, 0x00); // GCE: disposal 1, 100ms
  gif.push(0x2C, ...u16le(0), ...u16le(0), ...u16le(W), ...u16le(H), 0x00);
  gif.push(8);                                          // LZW min code size
  const frame=render(f);
  gif.push(...subBlocks(lzwEncode(8, frame)));
}
gif.push(0x3B);

const buf=Buffer.from(gif);
fs.writeFileSync('goodnight.gif', buf);
fs.copyFileSync('goodnight.gif', 'C:/Users/Admin/Desktop/goodnight.gif');
console.log(`goodnight.gif ready — ${(buf.length/1024).toFixed(0)} KB, ${FRAMES} frames, ${SECS}s loop (Desktop pe bhi copy ho gaya)`);
