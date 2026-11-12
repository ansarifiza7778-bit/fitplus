/* FitPulse app icons — pure Node zlib PNG encoder (koi library nahi chahiye) */
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

const crcTable = (()=>{
  const t = new Uint32Array(256);
  for(let n=0; n<256; n++){
    let c = n;
    for(let k=0; k<8; k++) c = c&1 ? 0xEDB88320^(c>>>1) : c>>>1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf){
  let c = 0xFFFFFFFF;
  for(let i=0; i<buf.length; i++) c = crcTable[(c^buf[i])&0xFF]^(c>>>8);
  return (c^0xFFFFFFFF)>>>0;
}
function chunk(type, data){
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(size, rows){
  const sig = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0; /* 8-bit RGBA */
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.concat(rows), {level:9})), chunk('IEND', Buffer.alloc(0))]);
}

/* gradient #06b6d4 -> #8b5cf6 (diagonal) + white implicit heart */
function genIcon(size, {rounded=true, scale=2.4}={}){
  const rows = [];
  const r = size*0.22;
  for(let y=0; y<size; y++){
    const row = Buffer.alloc(1 + size*4);
    row[0] = 0; /* filter: none */
    for(let x=0; x<size; x++){
      /* rounded-corner mask */
      let inside = true;
      if(rounded){
        const cx = Math.min(x, size-1-x), cy = Math.min(y, size-1-y);
        if(cx<r && cy<r){
          const dx=r-cx, dy=r-cy;
          inside = dx*dx + dy*dy <= r*r;
        }
      }
      const t = (x+y)/(2*size);
      let R = Math.round(6   + (139-6  )*t);
      let G = Math.round(182 + ( 92-182)*t);
      let B = Math.round(212 + (246-212)*t);
      /* heart: (x²+y²-1)³ - x²y³ <= 0 */
      const nx = scale*(x/size) - scale/2;
      const ny = 0.075 + scale*(0.5 - y/size);
      const v = Math.pow(nx*nx + ny*ny - 1, 3) - nx*nx*ny*ny*ny;
      let A = inside ? 255 : 0;
      if(inside){
        if(v <= 0){ R=255; G=255; B=255; }
        else if(v < 0.06){ const k = 1 - v/0.06; R=255; G=Math.round(255*k+(R-255)*(1-k)); B=Math.round(255*k+(B-255)*(1-k)); A=Math.round(255*k); }
      }
      row[1+x*4]=R; row[2+x*4]=G; row[3+x*4]=B; row[4+x*4]=A;
    }
    rows.push(row);
  }
  return encodePNG(size, rows);
}

const pub = path.resolve('public');
fs.mkdirSync(pub, {recursive: true});
fs.writeFileSync(path.join(pub, 'icon-192.png'), genIcon(192, {scale:2.4}));
fs.writeFileSync(path.join(pub, 'icon-512.png'), genIcon(512, {scale:2.4}));
fs.writeFileSync(path.join(pub, 'icon-512-maskable.png'), genIcon(512, {rounded:false, scale:3.0}));
console.log('icons generated:', fs.readdirSync(pub).join(', '));
