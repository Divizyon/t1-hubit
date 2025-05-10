// Basit bir duman efekti PNG'si oluşturur ve smoke.png olarak kaydeder
// Çalıştırmak için: npm install canvas
// node create_smoke_png.js

const { createCanvas } = require('canvas');
const fs = require('fs');

const size = 256;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Arka planı tamamen şeffaf yap
ctx.clearRect(0, 0, size, size);

// Duman için merkezde beyazdan şeffafa radial gradient
const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 10,   // inner circle
    size / 2, size / 2, 120   // outer circle
);
gradient.addColorStop(0, 'rgba(255,255,255,0.7)');
gradient.addColorStop(0.3, 'rgba(200,200,200,0.3)');
gradient.addColorStop(1, 'rgba(255,255,255,0)');

ctx.fillStyle = gradient;
ctx.beginPath();
ctx.arc(size / 2, size / 2, 120, 0, Math.PI * 2);
ctx.fill();

// PNG olarak kaydet
const out = fs.createWriteStream('smoke.png');
const stream = canvas.createPNGStream();
stream.pipe(out);
out.on('finish', () => console.log('smoke.png oluşturuldu!')); 