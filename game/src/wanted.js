// Wanted + police — a published state machine.
// Levels: 0 clean -> 1 noticed -> 2 chased -> 3 roadblocks -> 4 manhunt
// -> 5 army. Each transition records its reason. Police AI modes:
// patrol -> pursue (within leash) -> search (last known) -> recover.
// Heat decays when the player breaks line of sight + distance.
import { POLICE_UNITS } from './palette.js';

export const WantedLevel = { CLEAN: 0, NOTICED: 1, CHASED: 2, ROADBLOCK: 3, MANHUNT: 4, ARMY: 5 };
export const PoliceMode = { PATROL: 'patrol', PURSUE: 'pursue', SEARCH: 'search', RECOVER: 'recover' };

export class WantedSystem {
  constructor(onEvent) {
    this.onEvent = onEvent || (() => {});
    this.level = 0;
    this.heat = 0; // 0..100 within the level
    this.mode = PoliceMode.PATROL;
    this.inSight = false;
    this.lastSeen = { x: 0, z: 0 };
    this.escapeTimer = 0;
    this.history = [];
    this.units = POLICE_UNITS.map((u) => ({ ...u, mode: PoliceMode.PATROL }));
  }

  get stars() { return this.level; }
  get label() {
    return ['CLEAN', 'NOTICED', 'CHASED', 'ROADBLOCKS', 'MANHUNT', 'ARMY'][this.level];
  }

  commitCrime(kind, severity, at) {
    this.heat = Math.min(100, this.heat + severity);
    this.lastSeen = { x: at.x, z: at.z };
    const next = severity >= 40 ? 3 : severity >= 20 ? 2 : 1;
    if (next > this.level) this.setLevel(next, `crime:${kind}`);
    this.inSight = true;
    this.mode = PoliceMode.PURSUE;
  }

  setLevel(level, reason) {
    const prev = this.level;
    this.level = Math.max(0, Math.min(5, level));
    this.history.push({ from: prev, to: this.level, reason, at: Date.now() });
    this.onEvent('wanted', { from: prev, to: this.level, reason });
    if (this.level >= 3) this.mode = PoliceMode.PURSUE;
  }

  // Called every tick with the player's distance to the nearest unit and
  // whether any unit can see the player.
  tick(dt, nearestDist, seen) {
    this.inSight = seen;
    if (this.level === 0) { this.mode = PoliceMode.PATROL; return; }
    if (seen) {
      this.escapeTimer = 0;
      this.heat = Math.min(100, this.heat + dt * 4);
      this.mode = PoliceMode.PURSUE;
      if (this.heat >= 100 && this.level < 5) this.setLevel(this.level + 1, 'heat-max');
    } else if (nearestDist > 60) {
      this.escapeTimer += dt;
      this.heat = Math.max(0, this.heat - dt * 9);
      this.mode = this.escapeTimer > 4 ? PoliceMode.SEARCH : PoliceMode.PURSUE;
      if (this.heat <= 0) {
        this.setLevel(0, 'escaped');
        this.mode = PoliceMode.RECOVER;
      }
    } else {
      this.mode = PoliceMode.SEARCH;
      this.heat = Math.max(0, this.heat - dt * 2);
    }
    // Live distances jitter around their base values.
    for (const u of this.units) {
      u.dist = Math.max(3, u.dist + (Math.random() - 0.5) * dt * 12);
    }
  }

  activeUnits() { return this.level === 0 ? 0 : 5 + this.level; }
}
