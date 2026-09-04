# فايف إم (FiveM)

حزمة فايف إم على منصة سيرفرك (`serverk.gg`). هذا المستودع فيه كل شيء اللعبة تحتاجه عشان تشتغل على المنصة: ملف التعريف `serverk.yml`، الـ driver اللي يدير السيرفر، صورة الدوكر، والشروحات.

The FiveM game package for the Serverk platform (`serverk.gg`). This repo holds everything the game needs to run on the platform: the `serverk.yml` manifest, the driver that manages the server, the Docker image, and the guides.

## Layout

- `serverk.yml` — the game manifest: metadata, resources, ports (`30120` tcp+udp for the game, `40120` tcp for txAdmin), backup rules, guides.
- `src/` — the bridge driver: install (FiveM artifact, cfx-server-data, MariaDB, the txAdmin profile), lifecycle, query, backup, and the panel modules.
- `image/Dockerfile` — the runtime image (Ubuntu, MariaDB, xz); the compiled bridge binary is its entrypoint.
- `image/start.sh` — sources the `TXHOST_*` file, starts MariaDB, then runs FXServer with no `+exec` so it boots txAdmin, and forwards the panel console into the game.
- `assets/` — logo and banner (webp).
- `guides/` — player guides in Arabic and English.

## How a server runs

FXServer boots **txAdmin** rather than the game directly: `code/server/launcher/src/Server.cpp` picks `citizen:server:monitor` whenever the command line carries no `+exec`, and txAdmin then spawns the game itself. Serverk drives it the way txAdmin documents for hosting providers, through the `TXHOST_*` environment (`docs/env-config.md` in `citizenfx/txAdmin`):

- `TXHOST_DATA_PATH` is `txData` inside the volume, `TXHOST_TXA_PORT` and `TXHOST_FXS_PORT` come from the manifest ports, and `TXHOST_INTERFACE` is `0.0.0.0`.
- `TXHOST_DEFAULT_ACCOUNT` seeds `admins.json` with a `serverk` master account whose bcrypt hash the driver computes with `Bun.password`; the plaintext is shown in the panel's Licence tab.
- `TXHOST_DEFAULT_CFXKEY` and `TXHOST_DEFAULT_DB*` pre-fill txAdmin's own deployer, so a framework recipe arrives with the licence key and the bundled MariaDB already filled in.
- `TXHOST_QUIET_MODE` stays off, because the Serverk console is the live console.

txAdmin only auto-starts a server once its profile names a data path and an admin exists, so the driver writes the first `txData/default/config.json` itself — the same file the setup page writes — pointing at the seeded `server-data`. That is what lets a freshly ordered server boot with no browser step. What remains browser-side is txAdmin's own **recipe deployer**, which only runs from the setup state; the panel's "Open the setup page" action clears the data path so the owner can reach it, and the driver follows whatever path txAdmin records afterwards.

The panel console still works: txAdmin never reads its own stdin, so `start.sh` forwards each line the panel writes into the game through the bundled `[serverk]` resource, which exposes a token-guarded endpoint on the game port and runs the line with `ExecuteCommand`.

Builds are resolved from `https://changelogs-live.fivem.net/api/changelog/versions/linux/server` — recommended, latest, and only the pinned builds whose `support_policy` window is still open — with the HTML artifacts listing as the fallback and as the only source of a pinned build's revision.

## Develop

Everything runs on [Bun](https://bun.sh):

```sh
bun install
bun run check
bun run tsc
bun run test
bun run validate
bun run compile
```

`validate` checks the manifest, assets, and driver wiring with the exact validation the platform runs at publish. `compile` produces `dist/bridge`, an amd64 binary — serverk publishes game images for `linux/amd64` only.

The `.githooks/pre-commit` hook is the gate: it runs `fix`, `tsc`, `test`, `validate`, and `serverk-bridge schema --check` on every commit. `bun install` wires it up through the `prepare` script.

The driver is built on [`@serverkgg/bridge`](https://www.npmjs.com/package/@serverkgg/bridge). To develop against a local bridge checkout, `bun link` in the bridge package then `bun link @serverkgg/bridge` here — never commit a `file:` dependency.

## Contribute

- افتح issue لأي مشكلة أو اقتراح — بالعربي أو بالإنجليزي، كلها مرحّب فيها.
- Run `bun run check`, `bun run tsc`, `bun run test` and `bun run validate` before you open a pull request — the same checks the pre-commit hook runs.
- Releases are done by the Serverk team through the platform's central release pipeline; merged changes ride the next release.

## Art

Both assets are official Cfx.re art, sourced and never drawn.

- `assets/logo.webp` (256x256) is the FiveM client icon, extracted from the public installer `https://content.cfx.re/mirrors/client_download/FiveM.exe`. It is the executable's default icon — `RT_GROUP_ICON` id `1`, its largest entry `RT_ICON` id `6`, a 256x256 32bpp embedded PNG — re-encoded to WebP without resampling.
- `assets/banner.webp` (1280x400) is a crop of the fivem.net hero background `https://fivem.net/73663161434ea35812a20da2e517f102.jpg` (3840x2160), taken from the `index` stylesheet. Cfx ships it pre-dimmed for use behind page chrome, so the crop is tone-normalised to survive the panel's own scrim.

## Arabic copy

Arabic is the source language of the platform. Player-facing strings in `serverk.yml` and the guides use Gulf gaming Arabic — the game's Arabic name is always «فايف إم», written solid.
