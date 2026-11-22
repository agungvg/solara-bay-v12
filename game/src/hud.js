// HUD — the full Solara Bay overlay, built as DOM over the 3D canvas.
// Mission card + stage bar + NEXT, KPD police panel (6 named units +
// roles + live distances), wanted stars, cash + rank/RP bar, weapon slots
// with ammo, crew cards, circular minimap + district card, health/armour,
// speed + vehicle + condition, radio line, clock, dialogue (initials only
// — never a code-drawn face), timer + crew chips, IN SIGHT + AIR UNIT tags.
import { CREW, WEAPONS, DISTRICTS, RADIO_LINES } from './palette.js';
import { drawCityMap } from './minimap.js';

const $ = (tag, cls, html) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html != null) el.innerHTML = html;
  return el;
};

export class HUD {
  constructor(root) {
    this.root = root;
    this.root.classList.add('hud');
    this.build();
  }

  build() {
    // --- Top-left: mission card.
    this.missionCard = $('div', 'hud-mission');
    this.missionCard.innerHTML = `
      <div class="m-title"><span class="m-n"></span><span class="m-name"></span><span class="m-timer"></span></div>
      <div class="m-head"></div>
      <div class="m-brief"></div>
      <div class="m-stage"><span class="m-stage-label"></span><div class="m-stage-bar"><i></i></div></div>
      <div class="m-next">NEXT <b></b></div>`;
    this.root.appendChild(this.missionCard);

    // --- Police panel under the mission card.
    this.police = $('div', 'hud-police');
    this.police.innerHTML = `<div class="p-head"><span class="p-title">KPD RESPONSE</span><span class="p-count"></span></div><div class="p-rows"></div><div class="p-more"></div>`;
    this.root.appendChild(this.police);

    // --- Bottom-left: district card + minimap + health/armour.
    const left = $('div', 'hud-left');
    this.district = $('div', 'hud-district');
    this.district.innerHTML = `<div class="d-name"></div><div class="d-sub"></div><div class="d-meter"><i></i></div><div class="d-meter-label"></div>`;
    left.appendChild(this.district);
    this.mapWrap = $('div', 'hud-map');
    this.mapCanvas = document.createElement('canvas');
    this.mapCanvas.width = 220; this.mapCanvas.height = 220;
    this.mapWrap.appendChild(this.mapCanvas);
    const n = $('div', 'hud-map-n', 'N');
    this.mapWrap.appendChild(n);
    left.appendChild(this.mapWrap);
    this.vitals = $('div', 'hud-vitals');
    this.vitals.innerHTML = `<div class="v-row"><span>HEALTH</span><div class="v-bar health"><i></i></div><b class="v-health"></b></div>
      <div class="v-row"><span>ARMOUR</span><div class="v-bar armour"><i></i></div><b class="v-armour"></b></div>`;
    left.appendChild(this.vitals);
    this.root.appendChild(left);

    // --- Top-right: clock, cash, wanted, rank.
    const right = $('div', 'hud-right');
    this.clock = $('div', 'hud-clock', '');
    this.cash = $('div', 'hud-cash', '');
    this.wanted = $('div', 'hud-wanted', '');
    this.rank = $('div', 'hud-rank', '');
    right.append(this.clock, this.cash, this.wanted, this.rank);
    this.root.appendChild(right);

    // --- Right column: air-unit tag, weapons, crew.
    const col = $('div', 'hud-col');
    this.airTag = $('div', 'hud-air', 'AIR UNIT DEPLOYED');
    this.weapons = $('div', 'hud-weapons');
    this.weapons.innerHTML = WEAPONS.map((w) => `
      <div class="w-slot" data-slot="${w.slot}">
        <span class="w-num">${w.slot}</span>
        <span class="w-ico">${w.name === 'FISTS' ? '✊' : w.name === '.38' ? '🔫' : '▬▬'}</span>
        <span class="w-name">${w.name}</span><span class="w-ammo">${w.ammo}</span>
      </div>`).join('');
    this.crewBox = $('div', 'hud-crew');
    this.crewBox.innerHTML = CREW.slice(0, 3).map((c) => `
      <div class="c-card"><span class="c-key">${c.key}</span>
        <span class="c-ava">${c.initials}</span>
        <span class="c-ability">${c.ability}</span><span class="c-name">${c.name} · ${c.role}</span>
        <span class="c-cd">${c.cd ? c.cd + 's' : ''}</span></div>`).join('');
    col.append(this.airTag, this.weapons, this.crewBox);
    this.root.appendChild(col);

    // --- Bottom-right: speed + vehicle + condition + radio.
    const br = $('div', 'hud-br');
    this.speed = $('div', 'hud-speed', '');
    this.vehicle = $('div', 'hud-vehicle', '');
    this.radio = $('div', 'hud-radio', '');
    br.append(this.vehicle, this.speed, this.radio);
    this.root.appendChild(br);

    // --- Bottom-centre: dialogue (initials, never faces).
    this.dialogue = $('div', 'hud-dialogue');
    this.dialogue.innerHTML = `<span class="dlg-ava"></span><div><div class="dlg-name"></div><div class="dlg-text"></div></div>`;
    this.root.appendChild(this.dialogue);

    // --- Centre-top: IN SIGHT tag + crew chips (chase).
    this.inSight = $('div', 'hud-insight', 'IN SIGHT');
    this.root.appendChild(this.inSight);
    this.chips = $('div', 'hud-chips');
    this.root.appendChild(this.chips);
  }

  // state: { mission, stage, stageLabel, next, brief, timer, policeUnits,
  //   wanted, cash, rank, rp, rpMax, district, health, armour, speed,
  //   vehicle, condition, radio, clock, dialogue{name, initials, text},
  //   inSight, airUnit, chips[], player, policeBlips, route, weaponSlot }
  update(s) {
    const q = (sel) => this.missionCard.querySelector(sel);
    if (s.mission) {
      q('.m-n').textContent = s.mission.n;
      q('.m-name').textContent = s.mission.title;
      q('.m-head').textContent = s.mission.objective || s.mission.title;
      q('.m-brief').textContent = s.mission.brief;
      q('.m-timer').textContent = s.timer != null ? fmtTimer(s.timer) : '';
      q('.m-stage-label').textContent = s.stageLabel || '';
      const bar = q('.m-stage-bar i');
      const m = s.mission.stages.length;
      bar.style.width = `${((s.stage ?? 0) / m) * 100}%`;
      q('.m-next b').textContent = s.next || '';
    }
    const rows = this.police.querySelector('.p-rows');
    rows.innerHTML = (s.policeUnits || []).slice(0, 5).map((u) => `
      <div class="p-row"><span class="p-dot ${u.role === 'RAMMING' ? 'red' : u.role === 'SPOTLIGHT' ? 'blue' : ''}"></span>
      <span class="p-name">${u.name}</span><span class="p-role">${u.role}</span><span class="p-dist">${Math.round(u.dist)} m</span></div>`).join('');
    this.police.querySelector('.p-count').textContent = `${s.policeUnits?.length ?? 0} UNITS`;
    this.police.querySelector('.p-more').textContent = '+1 more · roadblock ahead';
    this.police.style.display = s.wanted > 0 ? '' : 'none';

    const d = DISTRICTS.find((x) => x.id === s.district) || DISTRICTS[0];
    this.district.querySelector('.d-name').textContent = d.name;
    this.district.querySelector('.d-sub').textContent = d.label;
    this.district.querySelector('.d-meter i').style.width = `${d.friendly}%`;
    this.district.querySelector('.d-meter-label').textContent = `${d.friendly >= 50 ? 'FRIENDLY' : 'NEUTRAL'} · ${d.friendly}`;

    this.clock.textContent = s.clock || '16:00';
    this.cash.textContent = `$${(s.cash ?? 0).toLocaleString('en-US')}`;
    this.wanted.innerHTML = '★'.repeat(s.wanted || 0) + '<span>' + '☆'.repeat(Math.max(0, 5 - (s.wanted || 0))) + '</span>';
    this.rank.innerHTML = `<span class="r-badge">RANK ${s.rank || 'B'}</span> <b>${s.rankName || 'FIXER'}</b>
      <div class="r-bar"><i style="width:${((s.rp ?? 0) / (s.rpMax ?? 1)) * 100}%"></i></div>
      <span class="r-rp">${s.rp ?? 0} / ${s.rpMax ?? 0} RP</span>`;

    this.weapons.querySelectorAll('.w-slot').forEach((el) => {
      el.classList.toggle('active', Number(el.dataset.slot) === (s.weaponSlot ?? 2) + 1);
    });
    this.speed.innerHTML = `<b>${Math.round(s.speed ?? 0)}</b><span>KM/H</span>`;
    const onFoot = s.vehicle === 'ON FOOT';
    this.vehicle.innerHTML = `<b>${s.vehicle || 'RUKAN PELO GT'}</b><span>${onFoot ? 'WALKING' : `${s.condition ?? 62}% DENTED`}</span>
      <div class="v-cond"><i style="width:${onFoot ? 0 : (s.condition ?? 62)}%"></i></div>`;
    this.radio.textContent = `♪ ${s.radio || RADIO_LINES[0]}`;
    if (s.dialogue) {
      this.dialogue.querySelector('.dlg-ava').textContent = s.dialogue.initials;
      this.dialogue.querySelector('.dlg-name').textContent = `${s.dialogue.name} · ${s.dialogue.role || ''}`;
      this.dialogue.querySelector('.dlg-text').textContent = s.dialogue.text;
    }
    this.inSight.style.display = s.inSight ? '' : 'none';
    this.airTag.style.display = s.airUnit ? '' : 'none';
    this.chips.innerHTML = (s.chips || []).map((c) => `<span class="chip">${c}</span>`).join('');
    this.vitals.querySelector('.v-bar.health i').style.width = `${s.health ?? 72}%`;
    this.vitals.querySelector('.v-bar.armour i').style.width = `${s.armour ?? 55}%`;
    this.vitals.querySelector('.v-health').textContent = s.health ?? 72;
    this.vitals.querySelector('.v-armour').textContent = s.armour ?? 55;

    const ctx = this.mapCanvas.getContext('2d');
    drawCityMap(ctx, 220, 220, {
      player: s.player, police: s.policeBlips || [], route: s.route || [],
      district: s.district, showLabels: false,
    });
  }
}

function fmtTimer(sec) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
