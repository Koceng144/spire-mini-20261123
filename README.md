# spire-mini-20261123

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Koceng144/spire-mini-20261123/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Koceng144/spire-mini-20261123/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

Entry for the [make.fun bounty "Make the best card game"](https://make.fun/bounty/best-card-game-20261122-1826).

**Spire Mini** is a Slay-the-Spire-style roguelike deckbuilder in one static page: climb 3 floors (a normal foe, an elite, then the Lantern Warden boss), read each enemy's telegraphed intent before your turn, and build your deck from 24 unique cards — attacks, block, buffs and draw, each with an upgraded version. Win a battle and draft 1 of 3 reward cards (or upgrade one you own); lose and the lantern dies. Card animations (deal, hover lift, drag to the enemy), floating damage numbers, WebAudio sound effects, a portrait phone layout with thumb-reach buttons, and a short tutorial on the title screen. No build step, no dependencies, no network requests.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

Or open `game/index.html` directly in a browser.

## The files

- `game/` — the game itself: `index.html`, `css/style.css`, and one-job-per-file modules in `game/js/` (`cards`, `enemies`, `battle`, `state`, `render`, `input`, `audio`, `random`, `main`, `shots`).
- `main.ts` — the make.fun hand-in: copies `game/` and `screenshots/` to the output and writes `dossier.json` via `vendor/makefun-game.ts`.
- `screenshots/` — title, mid-battle, reward draft and win screens.
- `serve.ts` — tiny local static server for development.
- `LICENSE` — MIT.
