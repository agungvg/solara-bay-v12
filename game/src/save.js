// Save system — 3 slots in localStorage, with migration by stable IDs.
// A slot holds cash, completed missions, ratings, district standing and
// the player position. Loading an old save maps known IDs explicitly.
const KEY = 'solara-bay-v12-saves-v1';

export class SaveSystem {
  constructor() {
    this.slots = this.loadAll();
  }

  loadAll() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [null, null, null];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [null, null, null];
      return [parsed[0] ?? null, parsed[1] ?? null, parsed[2] ?? null];
    } catch {
      return [null, null, null];
    }
  }

  persist() {
    try { localStorage.setItem(KEY, JSON.stringify(this.slots)); } catch { /* storage full/blocked */ }
  }

  // Write slot i (0-2). Returns the saved record.
  save(i, state) {
    const record = {
      version: 1,
      savedAt: new Date().toISOString(),
      cash: state.cash,
      completed: [...(state.completed ?? [])],
      ratings: { ...(state.ratings ?? {}) },
      district: state.district ?? 'kumala',
      player: { x: state.player?.x ?? 0, z: state.player?.z ?? 0 },
      playMinutes: state.playMinutes ?? 0,
    };
    this.slots[i] = record;
    this.persist();
    return record;
  }

  load(i) {
    const rec = this.slots[i];
    if (!rec || rec.version !== 1) return null;
    return rec;
  }

  clear(i) { this.slots[i] = null; this.persist(); }

  slotLabel(i) {
    const rec = this.slots[i];
    if (!rec) return 'EMPTY SLOT';
    const d = new Date(rec.savedAt);
    return `${rec.cash.toLocaleString('en-US')} $ · ${rec.completed.length}/8 missions · ${d.toLocaleDateString('en-GB')}`;
  }
}
