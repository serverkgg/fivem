## First, the licence key

FiveM needs a Cfx.re licence key, and the key belongs to you rather than to us. The server will not run without one, so this is always step one.

1. Open [portal.cfx.re](https://portal.cfx.re) and sign in with your Cfx.re account.
2. Go to **Server keys** and press **New server key**.
3. Put your server address in the IP field and give the key any name you like.
4. Copy the key — it starts with `cfxk_`.

Your server address:

@[field](server.address)

Then open the **Setup** tab in the panel, paste the key into **Licence key**, and save.

@[open](panel:setup)

> [!note]
> Saving the key reinstalls the server. Your files and your database stay where they are, but it takes a minute.

> [!warning]
> If your very first install stops and says it needs a licence key, open a support ticket — we finish the setup for you once you hand us the key.

## Start the server

Once the key is saved, press start and watch the console. This line means the key was accepted and the server is up:

```txt
Server license key authentication succeeded. Welcome!
```

@[open](console)

If you get this instead:

```txt
Could not authenticate server license key. The specified key does not exist.
```

the key is wrong or was not saved. Go back to the Setup tab and check you copied the whole thing.

## Join the server

1. Open FiveM on your computer.
2. Press **F8** to open the console.
3. Type `connect` followed by your server address.

@[field](server.address)

Give your friends the same line and they are in.

## What you get from the first minute

- A clean FiveM server with the Cfx.re base resources: `mapmanager`, `chat`, `spawnmanager` and `basic-gamemode`.
- A **MariaDB** database running inside your server, with its details in the **Database** tab. This is what ESX and QBCore need.
- A `server.cfg` ready in `server-data`, editable from the file manager or from the Settings tab.

@[open](panel:database)

## Change your server settings

The **Settings** tab writes straight into `server.cfg`: server name, description, player slots, locale, tags and OneSync.

@[open](panel:settings)

> [!warning]
> The free Cfx.re cap is 48 players. Going higher needs an Element Club subscription on your Cfx.re account — that subscription is yours, and has nothing to do with your Serverk plan.

## The lines we own

A few lines in `server.cfg` are rewritten by us on every boot so your server keeps working:

- `endpoint_add_tcp` and `endpoint_add_udp` — your server's ports.
- `sv_licenseKey` — the key you saved in the panel.
- `set mysql_connection_string` — your database connection.
- `set sv_playersToken` — so the panel's player table can read real names.
- `ensure serverk` — a small resource that makes the kick button work.

Anything you change on those lines is put back on the next start. The rest of the file is entirely yours.

## Next

Install a roleplay framework like ESX or QBCore against the database you already have — the frameworks guide walks through it.
