// Minimap + city map — one canvas painter used by the HUD minimap and
// the meta screen. It draws a REAL city: street grid, 8 named districts,
// water on the east, markers, route line, player arrow, police blips.
import { DISTRICTS } from './palette.js';

// District anchor positions in world space (x east, z north) for the map.
// Spread so neighbouring labels never collide on the meta map.
const WORLD = {
  kumala: [12, -35], pasaru: [-30, -5], marina: [60, -95], downtown: [-35, -80],
  brisa: [10, -160], puerto: [-45, -150], celeste: [5, -60], alto: [-40, -170],
};

export function drawCityMap(ctx, w, h, opts = {}) {
  const { player = null, police = [], route = [], district = 'kumala', showLabels = true } = opts;
  // Sea (east) + land.
  ctx.fillStyle = '#123a4d'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#2c2a33'; ctx.fillRect(0, 0, w * 0.68, h);
  ctx.fillStyle = '#1e7f9e'; ctx.fillRect(w * 0.68, 0, w * 0.32, h);
  // Beach band.
  ctx.fillStyle = '#e8c98f'; ctx.fillRect(w * 0.64, 0, w * 0.04, h);
  // Street grid.
  ctx.strokeStyle = 'rgba(200,190,170,0.55)'; ctx.lineWidth = Math.max(1, w / 160);
  for (let i = 1; i < 7; i++) {
    ctx.beginPath(); ctx.moveTo((w * 0.68 * i) / 7, 0); ctx.lineTo((w * 0.68 * i) / 7, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, (h * i) / 7); ctx.lineTo(w * 0.68, (h * i) / 7); ctx.stroke();
  }
  // Strand Boulevard (the thick coastal road).
  ctx.strokeStyle = '#ffb347'; ctx.lineWidth = Math.max(2, w / 90);
  ctx.beginPath(); ctx.moveTo(w * 0.60, 0); ctx.lineTo(w * 0.60, h); ctx.stroke();
  // District blocks + labels.
  ctx.textAlign = 'center';
  for (const d of DISTRICTS) {
    const [wx, wz] = WORLD[d.id];
    const x = ((wx + 80) / 160) * w * 0.68;
    const y = ((wz + 190) / 260) * h;
    ctx.fillStyle = d.id === district ? 'rgba(255,122,51,0.35)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(x - w * 0.05, y - h * 0.05, w * 0.1, h * 0.1);
    if (showLabels) {
      ctx.fillStyle = d.id === district ? '#ffb347' : '#cfd8dc';
      ctx.font = `bold ${Math.max(7, w / 32)}px Arial`;
      ctx.fillText(d.name, x, y + h * 0.075);
      // Friendly meter under the label.
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x - w * 0.035, y + h * 0.085, w * 0.07, 3);
      ctx.fillStyle = d.friendly >= 50 ? '#2fae6e' : '#ff7a33';
      ctx.fillRect(x - w * 0.035, y + h * 0.085, (w * 0.07 * d.friendly) / 100, 3);
    }
  }
  // Route line.
  if (route.length > 1) {
    ctx.strokeStyle = '#ff2e88'; ctx.lineWidth = Math.max(2, w / 80);
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    route.forEach(([wx, wz], i) => {
      const x = ((wx + 80) / 160) * w * 0.68, y = ((wz + 190) / 260) * h;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke(); ctx.setLineDash([]);
  }
  // Police blips (blue/red dots).
  for (const p of police) {
    const x = ((p.x + 80) / 160) * w * 0.68, y = ((p.z + 190) / 260) * h;
    ctx.fillStyle = '#4a90ff';
    ctx.beginPath(); ctx.arc(x, y, Math.max(3, w / 60), 0, 7); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
  }
  // Player arrow.
  if (player) {
    const x = ((player.x + 80) / 160) * w * 0.68, y = ((player.z + 190) / 260) * h;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(player.heading ?? 0);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(6, 7); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ff7a33'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }
  // North + scale.
  ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.max(8, w / 26)}px Arial`;
  ctx.textAlign = 'left'; ctx.fillText('N', 6, 14);
}
