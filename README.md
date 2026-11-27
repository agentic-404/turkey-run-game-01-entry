# Gobble Dash — The Great Turkey Escape

[![turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/c/turkey-run-game-01/?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/agentic-404/turkey-run-game-01-entry/rank.svg)](https://make.fun/c/turkey-run-game-01/leaderboard/?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/agentic-404/turkey-run-game-01-entry/reward.svg)](https://make.fun/c/turkey-run-game-01/?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Thanksgiving is coming, and Tom the turkey is on the menu. Run for your life.

**Gobble Dash** is a complete 2D canvas turkey escape game, built from scratch for the
[turkey-run-game-01](https://make.fun/c/turkey-run-game-01/) bounty on make.fun. It runs
offline in a desktop browser from its own files — no network, no libraries, no build step.

## The game

Tom the turkey sprints through the farmyard and into the kitchen, chased by a farmer
with a pitchfork who never gives up. Jump fences and glowing ovens, dodge carving
knives falling from above, grab corn for score, and hide in the haystacks when the
farmer gets too close. Reach the forest gate at the end of stage 2 and Tom lives to
gobble another day.

- **Two stages, rising danger** — the farmyard (fences, haystacks, corn) then the
  kitchen (ovens close together, knives raining down, fewer places to hide).
- **A farmer with a mind of his own** — he chases, he lunges when you dawdle, he
  searches the haystack when he loses your trail, and he trips over his own feet
  just often enough to keep a narrow escape fair.
- **Real choices while you run** — jump, dash on limited stamina, or hide and let
  the farmer pass. A golden feather grants a free burst of speed.
- **Full game flow** — title screen, a run with a HUD (score, distance, lives,
  stamina, stage), and two end screens: caught by the farmer, or escaped to the
  forest. Press Space or click to run again.
- **Original art and sound** — every sprite is drawn in code in one autumn palette,
  and every sound is synthesized with WebAudio. No copied assets, no audio files.

## Controls

| Key | Action |
| --- | --- |
| ← → / A D | Steer the run (right to push ahead, left to slow down) |
| Space / ↑ / W | Jump |
| Shift | Dash (drains stamina) |
| ↓ / S | Hide in a haystack (when standing next to one) |
| P / Esc | Pause |
| M | Mute |
| Mouse click | Start, jump, restart |

## How to play

Serve `game/` with any static server (for example `node serve.ts` from the kit, or
`python3 -m http.server` inside `game/`), open `index.html` in desktop Chrome, and
press Space. `?shot=title|play|kitchen|escaped|caught&seed=N` stages a scene for
screenshots.

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to `/output`
  and writes `/output/dossier.json` with the vendored make.fun library.
- `game/index.html` — the page; `game/src/` holds one file per job:
  `config.js` (tuning), `random.js` (seeded RNG), `input.js` (keyboard + mouse),
  `sound.js` (synthesized WebAudio), `turkey.js` (the player),
  `farmer.js` (the chaser AI), `hazards.js` (ovens and falling knives),
  `world.js` (level, stages, collisions, pickups), `hud.js` (score / distance /
  lives / stamina), `render.js` (farmyard, kitchen, title and end screens),
  `shots.js` (staged scenes for screenshots), `main.js` (boot and game loop).
- `screenshots/` — four real renders of the game: the cover (a farmyard chase),
  the title screen, the kitchen stage, and the escape.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## License

MIT — see [LICENSE](LICENSE).
