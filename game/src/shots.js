// Shot presets — the 4 dossier frames. Each shot names its mission, HUD
// state and dialogue; world.js owns the 3D staging. Cash varies per
// mission (a staged tell is the same cash in all 4 shots).
import { MISSIONS, POLICE_UNITS, GAME_META } from './palette.js';

function mission(id) { return MISSIONS.find((m) => m.id === id); }

export const SHOTS = {
  cover: {
    file: '1-cover.png',
    mission: mission(6), stage: 2, stageLabel: 'STAGE 3/4', next: 'Vanish',
    timer: 143, cash: 18450, wanted: 4, speed: 111, condition: 62,
    vehicle: 'RUKAN PELO GT', clock: '12:00', district: 'kumala',
    health: 72, armour: 55, weaponSlot: 2, radio: 'OMBO 98.4 — Island Pop',
    dialogue: { initials: 'MK', name: 'MIRA KESANG', role: 'FIXER',
      text: "He's making for Kumala Pier! Ram the Regent before it reaches the water!" },
    inSight: true, airUnit: true,
    chips: ['PILAR · GETAWAY', 'DEE · ON 25S', 'JUNO · 30S'],
    policeUnits: POLICE_UNITS,
    player: { x: 2, z: 0, heading: Math.PI },
    policeBlips: [{ x: -5, z: -8 }, { x: 6, z: -14 }, { x: -4, z: -30 }],
    route: [[2, 0], [8, -20], [20, -45], [42, -70]],
  },
  foot: {
    file: '2-foot.png',
    mission: mission(2), stage: 1, stageLabel: 'STAGE 2/4', next: 'Grab the drop',
    timer: 318, cash: 7270, wanted: 2, speed: 0, condition: 100,
    vehicle: 'ON FOOT', clock: '14:30', district: 'pasaru',
    health: 95, armour: 27, weaponSlot: 2, radio: 'KPD 44.1 — "All units, Pasaru"',
    dialogue: { initials: 'DO', name: 'DEE OKONKWO', role: 'CREW',
      text: 'Stall 12, under the pink awning. Take it slow — the market is watching.' },
    inSight: false, airUnit: false,
    chips: [],
    policeUnits: POLICE_UNITS.slice(0, 3),
    hint: 'DUCK BY A STALL TO HIDE',
    feed: 'CORAL-48: shots fired in the Pasaru night market',
    player: { x: -2, z: 2, heading: Math.PI + 0.35 },
    policeBlips: [{ x: -8, z: -12 }],
    route: [[-2, 2], [-12, -14], [-20, -24]],
  },
  chase: {
    file: '3-chase.png',
    mission: mission(3), stage: 2, stageLabel: 'STAGE 3/4', next: 'Reach the pier',
    timer: 107, cash: 12860, wanted: 3, speed: 111, condition: 58,
    vehicle: 'RUKAN PELO GT', clock: '17:45', district: 'celeste',
    health: 81, armour: 40, weaponSlot: 2, radio: 'Radio Mango 98.6 — "Guava Sunrise"',
    dialogue: { initials: 'JP', name: 'JUNO PARK', role: 'DRIVER',
      text: 'Sunset roadblock on the Malecon! Thread it — the pier is past the lights.' },
    inSight: true, airUnit: true,
    chips: ['PILAR · GETAWAY', 'DEE · ON 25S'],
    policeUnits: POLICE_UNITS,
    player: { x: 2, z: 0, heading: Math.PI },
    policeBlips: [{ x: -5, z: -8 }, { x: 6, z: -14 }],
    route: [[2, 0], [8, -20], [20, -45], [42, -70]],
  },
  meta: {
    file: '4-meta.png',
    mission: mission(6), stage: 2, stageLabel: 'STAGE 3/4', next: 'Vanish',
    timer: 143, cash: 21340, wanted: 0, speed: 0, condition: 62,
    vehicle: 'RUKAN PELO GT', clock: '16:20', district: 'kumala',
    health: 100, armour: 100, weaponSlot: 2, radio: 'OMBO 98.4 — Island Pop',
    dialogue: null, inSight: false, airUnit: false, chips: [],
    policeUnits: [],
    player: { x: 2, z: 0, heading: Math.PI },
    policeBlips: [],
    route: [[2, 0], [8, -20], [20, -45], [42, -70]],
    meta: GAME_META,
  },
};

export const SHOT_ORDER = ['cover', 'foot', 'chase', 'meta'];
