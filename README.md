# فايف إم (FiveM)

حزمة فايف إم على منصة سيرفرك (`serverk.gg`). هذا المستودع فيه كل شيء اللعبة تحتاجه عشان تشتغل على المنصة: ملف التعريف `serverk.yml`، الـ driver اللي يدير السيرفر، صورة الدوكر، والشروحات.

The FiveM game package for the Serverk platform (`serverk.gg`). This repo holds everything the game needs to run on the platform: the `serverk.yml` manifest, the driver that manages the server, the Docker image, and the guides.

## Layout

- `serverk.yml` — the game manifest: metadata, resources, ports, backup rules, guides.
- `src/` — the bridge driver: install (FiveM artifact, cfx-server-data, MariaDB), lifecycle, query, backup, and the panel modules.
- `image/Dockerfile` — the runtime image (Ubuntu, MariaDB, xz); the compiled bridge binary is its entrypoint.
- `image/start.sh` — starts MariaDB, then FXServer with its stdin attached to the panel console.
- `assets/` — logo and banner (webp).
- `guides/` — player guides in Arabic and English.

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
