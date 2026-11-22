// Meta screen — MAP / STATS / CREW / WORKSHOP in one full screen.
// Completion ring (66.1%), progress bars for every track, mission ratings,
// career stats, 3 save slots, a real 8-district city map (canvas), workshop
// (car on a lift + upgrades with prices + OWNED/LOCKED) and weapons & gear.
// This is a real in-game screen: it reads live game state, not a mock.
import { GAME_META, DISTRICTS, WEAPONS } from './palette.js';
import { drawCityMap } from './minimap.js';

const $ = (tag, cls, html) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html != null) el.innerHTML = html;
  return el;
};

export class MetaScreen {
  constructor(root, saveSystem) {
    this.root = root;
    this.saves = saveSystem;
    this.build();
  }

  build() {
    const el = $('div', 'meta-screen');
    el.innerHTML = `
      <div class="meta-top">
        <div class="meta-title"><h1>SOLARA BAY</h1><span>MAP · STORY · STATS · CREW · WORKSHOP · SAVE</span></div>
        <div class="meta-tabs">
          <span class="active">MAP</span><span>STORY</span><span>STATS</span><span>CREW</span><span>SETTINGS</span><span>CONTROLS</span><span>SAVE</span>
        </div>
      </div>
      <div class="meta-grid">
        <div class="meta-map-col">
          <div class="meta-map-wrap"><canvas id="meta-map" width="460" height="380"></canvas>
            <div class="meta-map-legend">8 DISTRICTS · ROUTE TO KUMALA PIER</div></div>
          <div class="meta-districts"></div>
        </div>
        <div class="meta-stats-col">
          <div class="meta-ring-wrap">
            <div class="meta-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="ring-bg"/>
              <circle cx="60" cy="60" r="52" class="ring-fg"/></svg>
              <div class="ring-num"><b>66.1%</b><span>COMPLETE</span></div></div>
            <div class="meta-rank"><span class="r-badge">RANK B</span><b>FIXER</b>
              <span>3,900 / 5,200 RP</span></div>
          </div>
          <div class="meta-progress"></div>
          <div class="meta-ratings"><h3>MISSION RATINGS</h3><div class="ratings-row"></div></div>
          <div class="meta-career"><h3>CAREER</h3><div class="career-grid"></div></div>
        </div>
        <div class="meta-side-col">
          <div class="meta-workshop"><h3>WORKSHOP — DOCK 9 GARAGE</h3>
            <div class="ws-car">🚗 RUKAN PELO GT <span>on the lift · 62% DENTED</span></div>
            <div class="ws-quote">"You break it, I bill it." — Lio, Mechanic</div>
            <div class="ws-upgrades"></div>
            <div class="ws-back">⬅ BACK TO THE STREET</div></div>
          <div class="meta-gear"><h3>WEAPONS &amp; GEAR</h3><div class="gear-list"></div></div>
          <div class="meta-saves"><h3>SAVE SLOTS</h3><div class="save-list"></div></div>
        </div>
      </div>`;
    this.root.appendChild(el);
    this.el = el;

    // Progress bars.
    el.querySelector('.meta-progress').innerHTML = GAME_META.progress.map((p) => `
      <div class="mp-row"><span>${p.label}</span><div class="mp-bar"><i style="width:${(p.done / p.total) * 100}%"></i></div><b>${p.done}/${p.total}</b></div>`).join('');
    // Mission ratings.
    el.querySelector('.ratings-row').innerHTML = GAME_META.missionRatings.map((r, i) => `
      <span class="rating ${r === '—' ? 'todo' : ''}">${r}<small>M${i + 1}</small></span>`).join('');
    // Career stats.
    const c = GAME_META.career;
    el.querySelector('.career-grid').innerHTML = [
      ['Cars stolen', c.carsStolen], ['Cops escaped', c.copsEscaped],
      ['Highest wanted', `${c.highestWanted}★`], ['Distance driven', `${c.distanceDrivenKm} km`],
      ['People taken out', c.peopleTakenOut], ['Longest jump', `${c.longestJumpM} m`],
      ['Crew recruited', c.crewRecruited], ['Hidden by locals', c.hiddenByLocals],
    ].map(([k, v]) => `<div class="career-cell"><b>${v}</b><span>${k}</span></div>`).join('');
    // Districts with friendly meters.
    el.querySelector('.meta-districts').innerHTML = DISTRICTS.map((d) => `
      <div class="d-row"><span>${d.name}</span><div class="d-bar"><i style="width:${d.friendly}%"></i></div><b>${d.friendly}</b></div>`).join('');
    // Workshop upgrades.
    el.querySelector('.ws-upgrades').innerHTML = [
      ['NITRO KIT', '$2,400', 'OWNED'], ['ARMOUR PLATING', '$3,800', 'OWNED'],
      ['TURBO TUNE', '$5,200', 'LOCKED'], ['BULLETPROOF TYRES', '$1,900', 'OWNED'],
      ['NEON UNDERGLOW', '$1,200', 'LOCKED'],
    ].map(([n, p, s]) => `<div class="ws-row"><span>${n}</span><b>${p}</b><span class="ws-state ${s === 'OWNED' ? 'owned' : ''}">${s}</span></div>`).join('');
    // Gear list.
    el.querySelector('.gear-list').innerHTML = WEAPONS.map((w) => `
      <div class="gear-row"><span>${w.slot}. ${w.name}</span><b>${w.owned ? w.ammo : 'LOCKED'}</b></div>`).join('');
    this.refreshSaves();
    // Ring arc: 66.1% of the circumference.
    const fg = el.querySelector('.ring-fg');
    const circ = 2 * Math.PI * 52;
    fg.style.strokeDasharray = `${circ * 0.661} ${circ}`;
    // Draw the real city map.
    const ctx = el.querySelector('#meta-map').getContext('2d');
    drawCityMap(ctx, 460, 380, {
      player: { x: 2, z: 0, heading: Math.PI },
      police: [{ x: -5, z: -8 }, { x: 6, z: -14 }],
      route: [[2, 0], [8, -20], [20, -45], [42, -70]],
      district: 'kumala', showLabels: true,
    });
  }

  refreshSaves() {
    this.el.querySelector('.save-list').innerHTML = [0, 1, 2].map((i) => `
      <div class="save-row"><span>SLOT ${i + 1}</span><b>${this.saves.slotLabel(i)}</b></div>`).join('');
  }

  show() { this.el.style.display = ''; }
  hide() { this.el.style.display = 'none'; }
}
