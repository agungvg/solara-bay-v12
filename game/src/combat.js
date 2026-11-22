// Combat — 6 weapon slots, ammo, hit feedback, enemy health.
// Logical phase order per tick: sample input -> resolve state -> snapshot
// hit volumes -> resolve contacts by priority -> apply damage -> emit
// presentation events. One hit instance hits a target at most once.
import { WEAPONS } from './palette.js';

export class CombatSystem {
  constructor(onEvent) {
    this.onEvent = onEvent || (() => {});
    this.weapons = WEAPONS.map((w) => ({ ...w, ammoLeft: w.ammo }));
    this.selected = 2; // SMG highlighted, like the chase shot
    this.enemies = []; // { id, health, pos, alive }
    this.nextHitId = 1;
  }

  get weapon() { return this.weapons[this.selected]; }

  select(slot) {
    const w = this.weapons[slot];
    if (!w) return { ok: false, reason: 'no such slot' };
    if (!w.owned) return { ok: false, reason: `${w.name} LOCKED — buy it at Ammu-Nation` };
    this.selected = slot;
    return { ok: true };
  }

  spawnEnemy(id, x, z, health = 100) {
    const e = { id, health, pos: { x, z }, alive: true };
    this.enemies.push(e);
    return e;
  }

  // Fire at a point: hits the nearest alive enemy within range + cone.
  fire(at) {
    const w = this.weapon;
    if (w.slot === 0) return this.punch(at);
    if (w.ammoLeft === '—' || w.ammoLeft === '0') {
      this.onEvent('combat', { kind: 'dry-fire', weapon: w.name });
      return { ok: false, reason: 'no ammo' };
    }
    const hitId = this.nextHitId++;
    let best = null; let bestD = 26;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.pos.x - at.x, e.pos.z - at.z);
      if (d < bestD) { best = e; bestD = d; }
    }
    if (best) {
      best.health -= w.slot === 3 ? 34 : w.slot === 2 ? 22 : 15;
      if (best.health <= 0) {
        best.alive = false;
        this.onEvent('combat', { kind: 'kill', hitId, enemy: best.id, weapon: w.name });
      } else {
        this.onEvent('combat', { kind: 'hit', hitId, enemy: best.id, health: best.health });
      }
      return { ok: true, hit: true, enemy: best.id, health: Math.max(0, best.health) };
    }
    this.onEvent('combat', { kind: 'miss', hitId, weapon: w.name });
    return { ok: true, hit: false };
  }

  punch(at) {
    const hitId = this.nextHitId++;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (Math.hypot(e.pos.x - at.x, e.pos.z - at.z) < 2.2) {
        e.health -= 20;
        if (e.health <= 0) { e.alive = false; this.onEvent('combat', { kind: 'kill', hitId, enemy: e.id, weapon: 'FISTS' }); }
        return { ok: true, hit: true, enemy: e.id, health: Math.max(0, e.health) };
      }
    }
    return { ok: true, hit: false };
  }

  aliveCount() { return this.enemies.filter((e) => e.alive).length; }
}
