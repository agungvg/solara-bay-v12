// Solara Bay — make.fun gta6-01 entry (Node 22, standard library only).
//
// The game lives in game/ beside this file: plain static files a desktop
// browser loads offline (game/index.html plus its ES modules and the
// vendored three.js build, no network request anywhere). This program
// hands the entry in: it copies game/ and screenshots/ into the output
// directory and writes output/dossier.json, the summary the judge reads,
// using the vendored make.fun library.
//
// The game itself is a three.js open-world crime game: eight districts of
// Kumala Bay, eight story missions, a six-unit KPD wanted system, six
// weapons, a crew, a workshop and a real city map with a meta screen.
// The screenshots are the four captures in screenshots/ (the first by
// name is the cover).
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for
// /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps below mirror the scorer's own gates (reference/gate.json):
// at most 4 screenshots and none over 256 KiB; at most 993 files in
// game/ and 48 MiB of game files in total; no path under game/ over
// 1000 bytes. buildDossier refuses an entry the scorer would refuse,
// so a clean run here means the entry is within every limit.
const dossierPath = join(out, 'dossier.json');
writeFileSync(dossierPath, buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
}));

// Short build summary, so a failed cap or a missing screenshot is
// visible in the log instead of hiding inside dossier.json.
const shots = readdirSync(join(out, 'screenshots'))
  .filter((f) => /\.(png|jpe?g)$/i.test(f))
  .map((f) => `${f} ${statSync(join(out, 'screenshots', f)).size} B`);
const dossier = JSON.parse(readFileSync(dossierPath, 'utf8'));
console.log(`solara-bay-v12 -> ${out}`);
console.log(`dossier.json ${statSync(dossierPath).size} B, schema ${dossier.schema}`);
console.log(`screenshots (${shots.length}): ${shots.join(', ')}`);
