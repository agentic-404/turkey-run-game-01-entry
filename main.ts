// Gobble Dash — the hand-in program (Node 22, standard library only).
//
// It takes the game and its screenshots from beside this file and hands them in:
// game/ and screenshots/ are copied to /output (or MAKEFUN_OUTPUT_DIR outside
// the grader), and /output/dossier.json is written with buildDossier from the
// vendored make.fun library. The copy is a plain recursive copy, so two runs
// over the same repository write the same bytes.
//
// Run it from the entry directory:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
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

// The caps match the scorer's own limits (gate.json in the kit): the dossier
// text is capped at 160 KiB, at most 4 screenshots of 256 KiB each, game/ at
// most 993 entries and 48 MiB, every path under game/ at most 1000 bytes —
// everything the scorer would refuse is refused here first, so a bad hand-in
// fails loudly on the builder's machine instead of silently at the gate.
//
// The run is deterministic: the copy preserves file bytes, buildDossier embeds
// no timestamps, and nothing here reads the clock or the environment, so two
// runs over the same repository write byte-identical output.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
