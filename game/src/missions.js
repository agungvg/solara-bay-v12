// Missions — 8 staged story missions with a small state machine.
// Stage flow: briefing -> stage objectives in order -> complete (reward)
// or failed (timer out / busted / wrecked). The engine only owns state;
// the HUD reads it, the world places markers for it.
import { MISSIONS } from './palette.js';

export const MissionState = { IDLE: 'idle', ACTIVE: 'active', DONE: 'done', FAILED: 'failed' };

export class MissionEngine {
  constructor(onEvent) {
    this.onEvent = onEvent || (() => {});
    this.current = null; // { def, stage, timer, startedAt }
    this.completed = new Set();
    this.ratings = {}; // mission id -> grade letter
    this.cash = 2450;
  }

  get def() { return this.current?.def ?? null; }
  get stageIndex() { return this.current?.stage ?? 0; }
  get stageText() {
    if (!this.current) return '';
    return this.current.def.stages[this.current.stage];
  }
  get stageLabel() {
    if (!this.current) return '—';
    return `STAGE ${this.current.stage + 1}/${this.current.def.stages.length}`;
  }
  get nextText() {
    if (!this.current) return 'Pick a mission';
    const d = this.current.def;
    return this.current.stage + 1 < d.stages.length
      ? d.stages[this.current.stage + 1]
      : 'Finish the job';
  }
  get timer() { return this.current ? Math.max(0, this.current.timer) : 0; }

  start(id) {
    const def = MISSIONS.find((m) => m.id === id);
    if (!def) return false;
    this.current = { def, stage: 0, timer: 240 };
    this.onEvent('mission-start', { mission: def });
    return true;
  }

  advance(reason = 'objective') {
    if (!this.current) return false;
    this.current.stage += 1;
    this.onEvent('stage', { mission: this.current.def, stage: this.current.stage, reason });
    if (this.current.stage >= this.current.def.stages.length) this.complete();
    return true;
  }

  complete() {
    if (!this.current) return;
    const def = this.current.def;
    this.cash += def.reward;
    this.completed.add(def.id);
    this.ratings[def.id] = def.reward >= 12000 ? 'S' : def.reward >= 8000 ? 'G' : 'B';
    this.onEvent('mission-complete', { mission: def, reward: def.reward, cash: this.cash });
    this.current = null;
  }

  fail(reason) {
    if (!this.current) return;
    this.onEvent('mission-failed', { mission: this.current.def, reason });
    this.current = null;
  }

  tick(dt) {
    if (!this.current) return;
    this.current.timer -= dt;
    if (this.current.timer <= 0) this.fail('time up');
  }

  // Mission 1 scripted playtest: drive the state machine through every
  // stage with no rendering, proving the loop end to end.
  playtestMission1() {
    const log = [];
    this.start(1);
    log.push(`started: ${this.def.title}`);
    for (let i = 0; i < this.def.stages.length; i++) {
      this.advance('playtest');
      log.push(`stage ${i + 1} done -> ${this.current ? this.stageText : 'complete'}`);
    }
    const ok = this.completed.has(1) && this.current === null;
    return { ok, cash: this.cash, log };
  }
}
