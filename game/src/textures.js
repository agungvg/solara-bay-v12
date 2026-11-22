// Procedural canvas textures for Solara Bay. Everything is drawn in code
// (seeded speckle, window grids, lettering) so the game ships zero image
// files and no surface is a flat untextured colour.
import * as THREE from 'three';
import { makeRng } from './rng.js';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function toTexture(c, repeatX = 1, repeatY = 1) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function speckle(ctx, w, h, rng, n, colors, size = 2) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colors[Math.floor(rng.next() * colors.length)];
    ctx.globalAlpha = 0.12 + rng.next() * 0.25;
    ctx.fillRect(rng.next() * w, rng.next() * h, size, size);
  }
  ctx.globalAlpha = 1;
}

// Warm asphalt with lane dashes, edge lines and faint tyre wear. The chase
// variant adds neon reflection streaks (wet sunset road, never black).
export function roadTexture({ neon = false } = {}) {
  const [c, ctx] = canvas(256, 512);
  const rng = makeRng(41);
  // Neon variant is a LIGHTER warm asphalt: a wet sunset road must read
  // as a road, never a black void.
  ctx.fillStyle = neon ? '#6a4a44' : '#3d3a44';
  ctx.fillRect(0, 0, 256, 512);
  speckle(ctx, 256, 512, rng, 2600, neon ? ['#5a3e38', '#7a5650', '#4a3632'] : ['#2c2931', '#4a4653', '#55505f', '#35323c'], 2);
  // Tyre-wear bands where wheels run.
  ctx.fillStyle = 'rgba(20,18,24,0.35)';
  ctx.fillRect(52, 0, 26, 512); ctx.fillRect(178, 0, 26, 512);
  // Centre double yellow.
  ctx.fillStyle = '#e8b93a';
  ctx.fillRect(122, 0, 5, 512); ctx.fillRect(131, 0, 5, 512);
  // White lane dashes.
  ctx.fillStyle = '#e8e6da';
  for (let y = 0; y < 512; y += 64) ctx.fillRect(88, y, 4, 34);
  for (let y = 0; y < 512; y += 64) ctx.fillRect(164, y, 34, 4);
  // Edge lines.
  ctx.fillStyle = '#d8d4c4';
  ctx.fillRect(10, 0, 4, 512); ctx.fillRect(242, 0, 4, 512);
  if (neon) {
    // Wet-road neon reflections: soft vertical streaks, pink + cyan + amber.
    for (const [col, x, w] of [['#ff2e88', 40, 20], ['#37c8e8', 200, 18], ['#ffb347', 130, 16], ['#ff2e88', 170, 10], ['#37c8e8', 80, 10]]) {
      const g = ctx.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.55; ctx.fillStyle = g; ctx.fillRect(x - w, 0, w * 3, 512);
    }
    ctx.globalAlpha = 1;
  }
  return toTexture(c, 1, 8);
}

// Warm beach sand with speckles, shell dots and faint footprints.
export function sandTexture() {
  const [c, ctx] = canvas(256, 256);
  const rng = makeRng(7);
  ctx.fillStyle = '#e8c98f'; ctx.fillRect(0, 0, 256, 256);
  speckle(ctx, 256, 256, rng, 2200, ['#d9b878', '#f2dcb0', '#c9a86a', '#fff0c8'], 2);
  ctx.fillStyle = 'rgba(120,90,50,0.35)';
  for (let i = 0; i < 26; i++) {
    ctx.beginPath(); ctx.ellipse(rng.next() * 256, rng.next() * 256, 3, 5, rng.next() * 3, 0, 7); ctx.fill();
  }
  return toTexture(c, 6, 6);
}

// Ocean: deep teal with lighter wave streaks and foam flecks.
export function waterTexture() {
  const [c, ctx] = canvas(256, 256);
  const rng = makeRng(99);
  ctx.fillStyle = '#14607e'; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) {
    ctx.strokeStyle = rng.chance(0.5) ? 'rgba(120,200,225,0.35)' : 'rgba(20,90,120,0.4)';
    ctx.lineWidth = 1 + rng.next() * 2;
    const y = rng.next() * 256, x = rng.next() * 256, len = 20 + rng.next() * 60;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y + rng.range(-4, 4)); ctx.stroke();
  }
  speckle(ctx, 256, 256, rng, 300, ['#bfe8f2', '#ffffff'], 1);
  return toTexture(c, 10, 10);
}

// Sunlit building facade: warm base + lit window grid + floor bands.
export function facadeTexture(base, lit, seed = 1) {
  const [c, ctx] = canvas(128, 256);
  const rng = makeRng(seed);
  ctx.fillStyle = base; ctx.fillRect(0, 0, 128, 256);
  speckle(ctx, 128, 256, rng, 500, ['rgba(0,0,0,0.15)', 'rgba(255,255,255,0.12)'], 2);
  for (let floor = 0; floor < 8; floor++) {
    const y = 12 + floor * 30;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, y + 24, 128, 3);
    for (let col = 0; col < 4; col++) {
      const x = 10 + col * 30;
      const litWin = rng.chance(0.55);
      ctx.fillStyle = litWin ? lit : '#2a3542';
      ctx.fillRect(x, y, 20, 20);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x, y, 20, 3);
    }
  }
  return toTexture(c, 1, 1);
}

// Brick plaza / market wall.
export function brickTexture() {
  const [c, ctx] = canvas(256, 256);
  const rng = makeRng(13);
  ctx.fillStyle = '#8a4a38'; ctx.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 8; col++) {
      const off = row % 2 ? 16 : 0;
      ctx.fillStyle = rng.pick(['#96543e', '#7e4232', '#a05a44', '#8a4a38']);
      ctx.fillRect(col * 32 + off - 16, row * 16, 30, 14);
    }
  }
  speckle(ctx, 256, 256, rng, 800, ['rgba(0,0,0,0.2)', 'rgba(255,255,255,0.1)'], 2);
  return toTexture(c, 4, 2);
}

// Striped market awning.
export function awningTexture(colorA, colorB) {
  const [c, ctx] = canvas(128, 64);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? colorA : colorB;
    ctx.fillRect(i * 16, 0, 16, 64);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  for (let i = 0; i < 8; i++) ctx.fillRect(i * 16, 56, 16, 8);
  return toTexture(c, 2, 1);
}

// POLICE door: white door panel, giant black POLICE + unit number + star.
// Drawn large so the lettering stays legible at a glance in the chase.
export function policeDoorTexture(unit = 'CORAL-48') {
  const [c, ctx] = canvas(512, 256);
  ctx.fillStyle = '#f4f2ec'; ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#14161c';
  ctx.font = '900 118px Arial, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('POLICE', 256, 118);
  ctx.font = '700 44px Arial, sans-serif';
  ctx.fillText(unit, 256, 208);
  // Star badge.
  ctx.fillStyle = '#14161c';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 12 : 28, a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx[i ? 'lineTo' : 'moveTo'](52 + r * Math.cos(a), 52 + r * Math.sin(a));
  }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f4f2ec'; ctx.font = '900 26px Arial, sans-serif';
  ctx.fillText('KPD', 52, 54);
  // Door seam + handle.
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 500, 244);
  ctx.fillStyle = '#14161c'; ctx.fillRect(430, 96, 44, 12);
  return toTexture(c, 1, 1);
}

// Soft round puff for billboard clouds (radial gradient sprite).
export function cloudPuffTexture() {
  const [c, ctx] = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Neon shop sign: glowing text on a dark board (e.g. FRUIT over the market).
export function neonSignTexture(text, color = '#ff2e88') {
  const [c, ctx] = canvas(512, 128);
  ctx.fillStyle = '#101014'; ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = color; ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 116);
  ctx.fillStyle = color;
  ctx.font = '900 84px Arial, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = color; ctx.shadowBlur = 22;
  ctx.fillText(text, 256, 68);
  ctx.shadowBlur = 0;
  return toTexture(c, 1, 1);
}

// Grass / park strip.
export function grassTexture() {
  const [c, ctx] = canvas(128, 128);
  const rng = makeRng(23);
  ctx.fillStyle = '#4a9e4f'; ctx.fillRect(0, 0, 128, 128);
  speckle(ctx, 128, 128, rng, 1200, ['#3c8a42', '#5cb85e', '#6fbf5a'], 2);
  return toTexture(c, 8, 8);
}
