// Solara Bay — shared data: palette, districts, missions, crew, weapons,
// police units. Pure data + tiny lookups; no rendering here so the HUD,
// minimap, meta screen and missions all read the same truth.

// The 8-colour Solara Bay palette. Sunset orange + amber lead; dusk purple
// and neon pink are accents only; ocean teal is the sea.
export const PALETTE = {
  sunset: 0xff7a33,
  amber: 0xffb347,
  dusk: 0x7b2fbe,
  neonPink: 0xff2e88,
  ocean: 0x1e7f9e,
  sand: 0xe8c98f,
  palm: 0x2fae6e,
  asphalt: 0x3d3a44,
};
export const PALETTE_CSS = {
  sunset: '#ff7a33', amber: '#ffb347', dusk: '#7b2fbe', neonPink: '#ff2e88',
  ocean: '#1e7f9e', sand: '#e8c98f', palm: '#2fae6e', asphalt: '#3d3a44',
};

// The 8 districts of Solara Bay. Friendly 0-100; wary = 100 - friendly.
export const DISTRICTS = [
  { id: 'kumala', name: 'KUMALA STRAND', label: 'Strand Boulevard', friendly: 58, x: 0.72, y: 0.62 },
  { id: 'pasaru', name: 'PASARU MARKET', label: 'Lantern Market', friendly: 74, x: 0.30, y: 0.55 },
  { id: 'marina', name: 'MARINA DEL SOL', label: 'Yacht Basin', friendly: 41, x: 0.80, y: 0.30 },
  { id: 'downtown', name: 'DOWNTOWN', label: 'Glass Canyon', friendly: 33, x: 0.45, y: 0.35 },
  { id: 'brisa', name: 'BRISA SOUND', label: 'Tarpon Bridge', friendly: 62, x: 0.55, y: 0.82 },
  { id: 'puerto', name: 'PUERTO VIEJO', label: 'Old Port', friendly: 47, x: 0.22, y: 0.80 },
  { id: 'celeste', name: 'MALECON CELESTE', label: 'Golden Mile', friendly: 66, x: 0.60, y: 0.45 },
  { id: 'alto', name: 'ALTO VISTA', label: 'Hills Estates', friendly: 29, x: 0.38, y: 0.18 },
];

// 8 story missions. Each has staged objectives; mission 1 is the playtest.
export const MISSIONS = [
  { id: 1, n: 'MISSION 1', title: 'FIRST LIGHT', objective: 'STEAL THE RUKAN PELO GT', giver: 'MIRA KESANG', role: 'FIXER',
    brief: 'Steal the Rukan Pelo GT from the Kumala car park and lose the tail.',
    stages: ['Reach the car park', 'Steal the Rukan Pelo GT', 'Lose the KPD tail', 'Deliver to the lockup'],
    reward: 2450, cash: 2450 },
  { id: 2, n: 'MISSION 2', title: 'LANTERN MARKET', objective: 'COLLECT THE DROP', giver: 'DEE OKONKWO', role: 'CREW',
    brief: 'Collect the drop in the Pasaru night market. Do not start a war.',
    stages: ['Enter the market', 'Find the stall', 'Grab the drop', 'Walk out clean'],
    reward: 4820, cash: 7270 },
  { id: 3, n: 'MISSION 3', title: 'GOLDEN HOUR', objective: 'OUTRUN THE SUNSET ROADBLOCK', giver: 'JUNO PARK', role: 'DRIVER',
    brief: 'Outrun the sunset roadblock on the Malecon and reach the pier.',
    stages: ['Hit the boulevard', 'Break the roadblock', 'Lose the heli', 'Reach the pier'],
    reward: 5590, cash: 12860 },
  { id: 4, n: 'MISSION 4', title: 'TIDE RUNNER', objective: 'BOARD THE YACHT', giver: 'MIRA KESANG', role: 'FIXER',
    brief: 'A yacht is leaving the marina with the ledger aboard. Board it.',
    stages: ['Reach the marina', 'Board the yacht', 'Grab the ledger', 'Swim clear'],
    reward: 8100, cash: 15400 },
  { id: 5, n: 'MISSION 5', title: 'HIGH ROLLER', objective: 'WIN THE ALTO VISTA RACE', giver: 'KAI TANAKA', role: 'WHEELMAN',
    brief: 'Win the Alto Vista street race. No cops, no excuses.',
    stages: ['Reach the start line', 'Win 3 laps', 'Dodge the spikes', 'Take the purse'],
    reward: 9200, cash: 20150 },
  { id: 6, n: 'MISSION 6', title: "ORU'S FALL", objective: 'WRECK THE REGENT', giver: 'MIRA KESANG', role: 'FIXER',
    brief: "Wreck Oru's Regent before it reaches the pier.",
    stages: ['Find the Regent', 'Ram it off the road', 'Finish the job', 'Vanish'],
    reward: 12400, cash: 18450 },
  { id: 7, n: 'MISSION 7', title: 'SILENT HARBOUR', objective: 'SINK THE EVIDENCE BOAT', giver: 'LO VARGAS', role: 'MECHANIC',
    brief: 'Sink the evidence boat in Puerto Viejo without a single shot fired.',
    stages: ['Slip into the port', 'Plant the charge', 'Clear the dock', 'Detonate offshore'],
    reward: 14800, cash: 22300 },
  { id: 8, n: 'MISSION 8', title: 'SOLARA BAY', objective: 'TAKE THE CITY BACK', giver: 'MIRA KESANG', role: 'FIXER',
    brief: 'One last job: take the whole city back, district by district.',
    stages: ['Rally the crew', 'Take the bridge', 'Storm the tower', 'Own the bay'],
    reward: 25000, cash: 38600 },
];

// Crew: each card shows a cooldown and an ability the HUD can trigger.
export const CREW = [
  { key: 'Z', initials: 'MK', name: 'Mira', role: 'Driver', ability: 'SWAP PLATES', cd: 0 },
  { key: 'X', initials: 'LO', name: 'Lio', role: 'Mechanic', ability: 'QUICK FIX', cd: 21 },
  { key: 'C', initials: 'KK', name: 'Kiki', role: 'Lookout', ability: 'EYES OUT', cd: 0 },
  { key: 'V', initials: 'JP', name: 'Juno', role: 'Wheelman', ability: 'GETAWAY', cd: 30 },
];

// Weapons 1-6. Slot 3 is the chase-shot highlight (SMG 30/60).
export const WEAPONS = [
  { slot: 1, name: 'FISTS', ammo: '∞', owned: true },
  { slot: 2, name: '.38', ammo: '60', owned: true },
  { slot: 3, name: 'SMG', ammo: '30/60', owned: true },
  { slot: 4, name: '12G', ammo: '18', owned: true },
  { slot: 5, name: 'AR-9', ammo: '—', owned: false },
  { slot: 6, name: 'RPG', ammo: '—', owned: false },
];

// KPD response units: name, role, live distance. The police panel reads this.
export const POLICE_UNITS = [
  { name: 'KITE-1', role: 'MARKSMAN', dist: 15 },
  { name: 'MARLIN-3', role: 'SHORE WATCH', dist: 187 },
  { name: 'CORAL-48', role: 'RAMMING', dist: 7 },
  { name: 'CORAL-85', role: 'FLANKING', dist: 14 },
  { name: 'CORAL-43', role: 'RAMMING', dist: 15 },
  { name: 'AIR-1', role: 'SPOTLIGHT', dist: 36 },
];

export const RADIO_LINES = [
  'OMBO 98.4 — Island Pop',
  'Radio Mango 98.6 — "Guava Sunrise"',
  'CELESTE 98.1 — Malecón Mirage',
  'KPD 44.1 — "All units, Strand Boulevard"',
];

export const GAME_META = {
  title: 'SOLARA BAY',
  tagline: 'Open-world crime on the Kumala Strand',
  completion: 66.1,
  rank: 'B',
  rankName: 'FIXER',
  rp: 3900,
  rpMax: 5200,
  // Career stats for the meta screen.
  career: {
    carsStolen: 41, copsEscaped: 17, highestWanted: 4, distanceDrivenKm: 312,
    peopleTakenOut: 23, longestJumpM: 48, crewRecruited: 4, hiddenByLocals: 9,
  },
  missionRatings: ['G', 'S', 'G', 'B', 'S', '—', '—', '—'],
  progress: [
    { label: 'Story missions', done: 5, total: 8 },
    { label: 'Street races', done: 3, total: 6 },
    { label: 'Stunt jumps', done: 7, total: 12 },
    { label: 'Collectibles', done: 18, total: 30 },
    { label: 'Export list', done: 4, total: 10 },
    { label: 'District jobs', done: 11, total: 20 },
    { label: 'Districts friendly', done: 5, total: 8 },
    { label: 'Crew recruited', done: 4, total: 6 },
  ],
};
