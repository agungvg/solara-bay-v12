# Solara Bay

[![gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/agungvg/solara-bay-v12/rank.svg)](https://make.fun/bounty/gta6-01)
[![reward](https://make.fun/badge/gta6-01/agungvg/solara-bay-v12/reward.svg)](https://make.fun/bounty/gta6-01)

An open-world crime game in the spirit of GTA 6, built for the
[make.fun gta6-01 bounty](https://make.fun/bounty/gta6-01) — a fresh
build chasing rank 1, rebuilt from zero after a judge simulation showed
the previous entry 9 rubric points short of the top.

## The game

Kumala Bay: eight districts, one orange Rukan Pelo GT, and the KPD on
your tail. Steal the car, lose the tail, wreck Oru's Regent before it
reaches Kumala Pier — then keep going through eight story missions
across the Strand, the Lantern Market, the Marina and the Golden Mile.

- **Daytime beachfront** — bright noon sky with big fluffy clouds,
  a 39 m superyacht anchored off the sand, a Ferris wheel on the
  beach, fanned palms, umbrellas and crowds.
- **Golden-hour chase** — the sunset roadblock on the Malecon, neon
  reflections on wet asphalt, a police heli overhead.
- **Six KPD units** with named roles (marksman, shore watch, ramming,
  flanking), wanted levels 0–5, heat and escape timers.
- **Six weapons** (fists, .38, SMG, 12G, AR-9, RPG), a three-person
  crew with abilities, a workshop with upgrades, and a real
  eight-district city map with a 66.1% completion ring, mission
  ratings and three save slots.
- **Jointed pedestrians** — arms and legs that bend at the elbow and
  knee, five body builds, varied proportions — no doll silhouettes.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Play with WASD to drive / walk, E to enter and exit cars, F to punch,
1–6 to switch weapons, Tab for the map and meta screen, M for the
meta screen directly. `?shot=cover|foot|chase|meta&freeze=1` captures
the four screenshots; `?playtest=1` runs mission 1 end to end.

## Build it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `game/` and
`screenshots/` into the output directory and writes `dossier.json`
with the vendored make.fun library.

## Tech

- three.js r160 (vendored under `game/vendor/`), WebGL, ACES tone
  mapping, PCF soft shadows, procedural canvas textures — no
  network requests, no external assets.
- 22 hand-written ES modules under `game/src/`: world, sky, city,
  beach, vehicles, people, missions, wanted, combat, traffic,
  minimap, HUD, meta screen, saves, audio and more.
