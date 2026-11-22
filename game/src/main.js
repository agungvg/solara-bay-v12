// Solara Bay — main controller.
// Boots the renderer, owns the fixed-timestep loop, input, driving/walking,
// missions + wanted + combat wiring, HUD updates, the meta screen, shot
// mode (?shot=cover|foot|chase|meta&freeze=1) and the playtest (?playtest=1).
// No network requests: everything is vendored or procedural.
import * as THREE from 'three';
import { World } from './world.js';
import { HUD } from './hud.js';
import { MetaScreen } from './meta.js';
import { MissionEngine } from './missions.js';
import { WantedSystem } from './wanted.js';
import { CombatSystem } from './combat.js';
import { SaveSystem } from './save.js';
import { AudioEngine } from './audio.js';
import { SHOTS } from './shots.js';
import { runPlaytest } from './playtest.js';
import { GAME_META, RADIO_LINES } from './palette.js';

window.__errors = [];
window.addEventListener('error', (e) => window.__errors.push(String(e.message)));
window.addEventListener('unhandledrejection', (e) => window.__errors.push(String(e.reason)));

const params = new URLSearchParams(location.search);
const SHOT = params.get('shot');
const FREEZE = params.get('freeze') === '1';
const PLAYTEST = params.get('playtest') === '1';

class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 1200);
    this.camera.position.set(8, 5, 16);

    this.world = new World(this.renderer, this.scene, this.camera);
    this.missions = new MissionEngine((ev, d) => this.onEvent(ev, d));
    this.wanted = new WantedSystem((ev, d) => this.onEvent(ev, d));
    this.combat = new CombatSystem((ev, d) => this.onEvent(ev, d));
    this.saves = new SaveSystem();
    this.audio = new AudioEngine();

    this.hud = new HUD(document.getElementById('hud'));
    this.meta = new MetaScreen(document.getElementById('meta'), this.saves);
    this.meta.hide();

    // Player / car state.
    this.mode = 'foot';
    this.playerPos = new THREE.Vector3(0.5, 0, 8);
    this.playerHeading = Math.PI;
    this.heroPos = new THREE.Vector3(0.5, 0, 4);
    this.heroHeading = 0;
    this.speed = 0; // m/s
    this.health = 100; this.armour = 55;
    this.playMinutes = 0;
    this.started = false;
    this.metaOpen = false;
    this.keys = new Set();
    this.shotMode = !!SHOT;
    this.clock = new THREE.Clock();
    this.acc = 0;

    this.bindInput();
    this.buildStartScreen();
    if (SHOT) this.enterShotMode(SHOT);
    else if (PLAYTEST) this.enterPlaytestMode();
    else this.showStart();

    addEventListener('resize', () => this.onResize());
    this.loop();
  }

  onEvent(ev, d) {
    if (ev === 'mission-complete') this.audio.blip(1320);
    if (ev === 'wanted') this.audio.setSiren(this.wanted.level > 0);
    const status = document.getElementById('status');
    if (status) status.textContent = `${ev}: ${d?.mission?.title ?? d?.reason ?? ''}`;
  }

  buildStartScreen() {
    const el = document.getElementById('start');
    el.innerHTML = `
      <div class="start-card">
        <div class="start-kicker">MAKE.FUN · GTA6-01</div>
        <h1>SOLARA BAY</h1>
        <p class="start-tag">Open-world crime on the Kumala Strand — 8 story missions,
        a crew, district standing, street races, and the KPD on your tail.</p>
        <div class="start-missions">8 MISSIONS · 6 WEAPONS · 4 CREW · 8 DISTRICTS · 66.1% COMPLETE</div>
        <button id="start-btn">▶ START — MISSION 1: FIRST LIGHT</button>
        <div class="start-controls">WASD drive / walk · E enter car · F shoot / punch · 1–6 weapons ·
        TAB map &amp; stats · M mute · SHIFT handbrake</div>
      </div>`;
    el.querySelector('#start-btn').addEventListener('click', () => this.startGame());
  }

  showStart() { document.getElementById('start').style.display = ''; }
  hideStart() { document.getElementById('start').style.display = 'none'; }

  startGame() {
    this.audio.resume();
    this.hideStart();
    this.started = true;
    this.world.applySky('noon');
    this.missions.start(1);
    this.setMode('foot');
    this.world.hero.position.copy(this.heroPos);
    this.world.player.group.visible = true;
  }

  enterShotMode(shot) {
    this.hideStart();
    this.started = true;
    this.world.frozen = FREEZE;
    this.world.stage(shot);
    const s = SHOTS[shot];
    this.missions.start(s.mission.id);
    // Jump the mission engine to the shot's stage.
    for (let i = 0; i < s.stage; i++) this.missions.current.stage += 1;
    this.missions.current.timer = s.timer;
    this.missions.cash = s.cash;
    this.wanted.level = s.wanted;
    this.wanted.mode = s.wanted > 0 ? 'pursue' : 'patrol';
    this.wanted.inSight = s.inSight;
    this.wanted.units = s.policeUnits.map((u) => ({ ...u }));
    this.speed = (s.speed || 0) / 3.6;
    this.health = s.health; this.armour = s.armour;
    if (shot === 'meta') {
      // Seed slot 1 FIRST, then re-render the save list (the constructor
      // renders it once with empty slots; show() only toggles display).
      this.saves.save(0, {
        cash: 21340, completed: [1, 2, 3, 4, 5],
        ratings: { 1: 'G', 2: 'S', 3: 'G', 4: 'B', 5: 'S' },
        district: 'kumala', player: { x: 2, z: 0 }, playMinutes: 187,
      });
      this.meta.refreshSaves();
      this.meta.show();
      // The meta screen is a full opaque screen: hide the HUD behind it.
      document.getElementById('hud').style.display = 'none';
    }
    this.shotState = s;
    this.shotName = shot;
    // The road texture for the chase is neon (set by world.stage).
    this.renderShot();
  }

  async enterPlaytestMode() {
    this.hideStart();
    this.started = true;
    this.world.applySky('noon');
    this.world.hero.position.copy(this.heroPos);
    this.world.player.group.visible = true;
    await new Promise((r) => setTimeout(r, 600));
    await runPlaytest(this);
    window.__ready = true;
  }

  setMode(mode) {
    this.mode = mode;
    this.world.player.group.visible = mode === 'foot';
  }

  enterCar() {
    const d = this.playerPos.distanceTo(this.heroPos);
    if (d > 6) return false;
    this.setMode('drive');
    this.wanted.commitCrime('grand-theft-auto', 25, { x: this.heroPos.x, z: this.heroPos.z });
    this.audio.blip(660);
    return true;
  }

  exitCar() {
    this.setMode('foot');
    this.playerPos.set(this.heroPos.x + 2.2, 0, this.heroPos.z + 1);
  }

  bindInput() {
    addEventListener('keydown', (e) => {
      if (e.key === 'Tab') { e.preventDefault(); this.toggleMeta(); return; }
      this.keys.add(e.code);
      if (e.code === 'KeyE') {
        if (this.mode === 'foot') this.enterCar();
        else this.exitCar();
      }
      if (e.code === 'KeyF') this.fire();
      if (e.code === 'KeyM') this.audio.toggleMute();
      if (/^Digit[1-6]$/.test(e.code)) {
        const r = this.combat.select(Number(e.code.slice(5)) - 1);
        if (!r.ok) this.flashHint(r.reason);
      }
      if (e.code === 'KeyZ' || e.code === 'KeyX' || e.code === 'KeyC') this.audio.blip(990);
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    this.canvas.addEventListener('pointerdown', () => this.audio.resume());
  }

  fire() {
    const ahead = this.mode === 'drive'
      ? { x: this.heroPos.x - Math.sin(this.heroHeading) * 10, z: this.heroPos.z - Math.cos(this.heroHeading) * 10 }
      : { x: this.playerPos.x - Math.sin(this.playerHeading) * 3, z: this.playerPos.z - Math.cos(this.playerHeading) * 3 };
    this.combat.fire(ahead);
  }

  flashHint(text) {
    const el = document.getElementById('hint');
    el.textContent = text;
    el.style.opacity = 1;
    setTimeout(() => { el.style.opacity = 0; }, 2200);
  }

  toggleMeta() {
    this.metaOpen = !this.metaOpen;
    if (this.metaOpen) {
      this.meta.refreshSaves(); this.meta.show();
      document.getElementById('hud').style.display = 'none';
    } else {
      this.meta.hide();
      document.getElementById('hud').style.display = '';
    }
  }

  onResize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
  }

  // Fixed 60 Hz logical tick; render is presentation.
  loop() {
    if (this.stopLoop) return;
    requestAnimationFrame(() => this.loop());
    const dt = Math.min(this.clock.getDelta(), 0.1);
    if (!this.shotMode && this.started && !this.metaOpen) {
      this.acc += dt;
      while (this.acc >= 1 / 60) { this.tick(1 / 60); this.acc -= 1 / 60; }
    }
    this.world.update(FREEZE ? 0 : dt);
    this.updateCamera(dt);
    this.updateHud();
    this.renderer.render(this.scene, this.camera);
    if (!window.__ready) {
      this.readyFrames = (this.readyFrames ?? 0) + 1;
      if (this.readyFrames >= 3) {
        window.__ready = true;
        // Frozen shot: stop the loop so the compositor can present the
        // frame for the screenshot (SwiftShader re-renders would starve it).
        if (this.shotMode && FREEZE) this.stopLoop = true;
      }
    }
  }

  tick(dt) {
    this.playMinutes += dt / 60;
    this.missions.tick(dt);
    const nearest = this.wanted.units.length
      ? Math.min(...this.wanted.units.map((u) => u.dist)) : 999;
    this.wanted.tick(dt, nearest, this.wanted.level > 0 && this.speed > 2);
    this.audio.tick(dt, this.wanted.level);
    const k = this.keys;
    if (this.mode === 'drive') {
      const accel = k.has('KeyW') ? 14 : k.has('KeyS') ? -18 : 0;
      this.speed += accel * dt;
      if (!k.has('KeyW') && !k.has('KeyS')) this.speed *= (1 - 0.6 * dt);
      if (k.has('Space')) this.speed *= (1 - 2.4 * dt);
      this.speed = Math.max(-8, Math.min(31, this.speed));
      const steer = (k.has('KeyA') ? 1 : 0) - (k.has('KeyD') ? 1 : 0);
      this.heroHeading += steer * 1.6 * dt * Math.sign(this.speed) * Math.min(1, Math.abs(this.speed) / 8);
      this.heroPos.x -= Math.sin(this.heroHeading) * this.speed * dt;
      this.heroPos.z -= Math.cos(this.heroHeading) * this.speed * dt;
      this.heroPos.x = Math.max(-6.2, Math.min(6.2, this.heroPos.x));
      this.heroPos.z = Math.max(-178, Math.min(52, this.heroPos.z));
      this.world.hero.position.copy(this.heroPos);
      this.world.hero.rotation.y = this.heroHeading;
      this.audio.setDriving(Math.abs(this.speed) * 3.6, true);
      // Mission 1: reaching the lockup advances the stage.
      if (this.missions.def?.id === 1 && this.missions.stageIndex === 3 && this.heroPos.z < -55) {
        this.missions.advance('delivered');
      }
    } else {
      const mv = new THREE.Vector3(
        (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0), 0,
        (k.has('KeyS') ? 1 : 0) - (k.has('KeyW') ? 1 : 0),
      );
      if (mv.lengthSq() > 0) {
        mv.normalize();
        this.playerHeading = Math.atan2(mv.x, mv.z);
        this.playerPos.addScaledVector(mv, 4.2 * dt);
        this.playerPos.x = Math.max(-60, Math.min(60, this.playerPos.x));
        this.playerPos.z = Math.max(-180, Math.min(55, this.playerPos.z));
        this.world.player.group.position.copy(this.playerPos);
        this.world.player.group.rotation.y = this.playerHeading + Math.PI;
      }
      this.audio.setDriving(0, false);
      // Mission 1: reaching the car park advances stage 1.
      if (this.missions.def?.id === 1 && this.missions.stageIndex === 0 &&
          this.playerPos.distanceTo(this.heroPos) < 4) {
        this.missions.advance('reached car park');
      }
    }
  }

  updateCamera(dt) {
    if (this.shotMode) return; // staged camera stays put
    const target = this.mode === 'drive' ? this.heroPos : this.playerPos;
    const heading = this.mode === 'drive' ? this.heroHeading : this.playerHeading;
    const back = this.mode === 'drive' ? 9.5 : 6.5;
    const height = this.mode === 'drive' ? 4.2 : 3.4;
    const desired = new THREE.Vector3(
      target.x + Math.sin(heading) * back,
      height,
      target.z + Math.cos(heading) * back,
    );
    this.camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
    this.camera.lookAt(target.x, 1.4, target.z - 4);
  }

  hudState() {
    if (this.shotMode && this.shotState) {
      const s = this.shotState;
      return {
        mission: s.mission, stage: s.stage, stageLabel: s.stageLabel, next: s.next,
        brief: s.mission.brief, timer: this.missions.timer || s.timer,
        policeUnits: this.wanted.units, wanted: s.wanted, cash: s.cash,
        rank: GAME_META.rank, rankName: GAME_META.rankName, rp: GAME_META.rp, rpMax: GAME_META.rpMax,
        district: s.district, health: s.health, armour: s.armour, speed: s.speed,
        vehicle: s.vehicle, condition: s.condition, radio: s.radio, clock: s.clock,
        dialogue: s.dialogue, inSight: s.inSight, airUnit: s.airUnit, chips: s.chips,
        player: s.player, policeBlips: s.policeBlips, route: s.route, weaponSlot: s.weaponSlot,
        hint: s.hint, feed: s.feed,
      };
    }
    const m = this.missions;
    return {
      mission: m.def || { n: 'FREE ROAM', title: 'SOLARA BAY', brief: 'Explore the city. Start a mission at the marker.', stages: ['—'] },
      stage: m.stageIndex, stageLabel: m.stageLabel, next: m.nextText,
      brief: m.def?.brief ?? 'Explore the city.',
      timer: m.timer,
      policeUnits: this.wanted.units, wanted: this.wanted.level,
      cash: m.cash, rank: GAME_META.rank, rankName: GAME_META.rankName,
      rp: GAME_META.rp, rpMax: GAME_META.rpMax,
      district: 'kumala', health: this.health, armour: this.armour,
      speed: Math.abs(this.speed) * 3.6,
      vehicle: this.mode === 'drive' ? 'RUKAN PELO GT' : 'ON FOOT',
      condition: 62, radio: RADIO_LINES[0], clock: '12:00',
      dialogue: { initials: 'MK', name: 'MIRA KESANG', role: 'FIXER',
        text: m.def ? m.def.brief : 'The bay is yours. Make it count.' },
      inSight: this.wanted.inSight, airUnit: this.wanted.level >= 3,
      chips: [], player: { x: this.playerPos.x, z: this.playerPos.z, heading: this.playerHeading },
      policeBlips: this.wanted.units.slice(0, 3).map((u, i) => ({ x: -5 + i * 4, z: -8 - i * 6 })),
      route: [[this.playerPos.x, this.playerPos.z], [8, -20], [20, -45]],
      weaponSlot: this.combat.selected,
    };
  }

  updateHud() {
    const s = this.hudState();
    this.hud.update(s);
    const hint = document.getElementById('hint');
    if (s.hint) { hint.textContent = `💡 ${s.hint}`; hint.style.opacity = 1; }
    const feed = document.getElementById('feed');
    if (s.feed) { feed.textContent = `📻 ${s.feed}`; feed.style.opacity = 1; }
  }

  renderShot() {
    // One clean render for the staged frame; the loop keeps presenting it.
    this.renderer.render(this.scene, this.camera);
  }
}

const game = new Game();
window.__game = game;
