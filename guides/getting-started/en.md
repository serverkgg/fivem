## First, the licence key

FiveM needs a Cfx.re licence key, and the key belongs to you rather than to us. The server will not run without one, so this is always step one.

1. Open [portal.cfx.re](https://portal.cfx.re) and sign in with your Cfx.re account.
2. Go to **Servers**, then **Registration Keys**, and press **Generate Key +**.
3. The portal asks for a display name and nothing else — there is no IP or address field. Give it any name that tells the keys apart, such as your server's name.
4. Press **Generate** and copy the key. It is 33 characters long and starts with `cfxk_`.

Then open the **Setup** tab in the panel, paste the key into **Licence key**, and save.

@[open](panel:setup)

> [!note]
> Saving the key reinstalls the server. Your files and your database stay where they are, but it takes a minute.

> [!note]
> A Cfx.re account may hold three active registration keys. If you are at the limit, delete an old key in the portal before generating a new one.

> [!warning]
> The key is a secret. If it ever leaks — posted by mistake, or shared with someone — delete it in the portal, generate a new one, and paste the new key into the Setup tab.

> [!note]
> Your server provisions and the txAdmin panel opens before you paste the key, but the game server itself will not come up — the console retries and prints the licence error each time. Saving the key gets everything running.

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

## The txAdmin panel

Your server runs under **txAdmin**, the panel Cfx.re ships for FiveM servers. The Serverk panel covers most of the work — power, console, files, settings and players — and txAdmin adds what it is best at: installing a framework in one click, banning and watching players, and scheduled restarts.

The txAdmin address is on your server page under **txAdmin panel**, and the username and password are in the **Setup** tab.

@[open](panel:setup)

1. Open the txAdmin address in your browser.
2. Sign in as `serverk` with the password from the Setup tab.
3. On the first sign-in txAdmin may ask you to change the password — change it and keep it somewhere safe.

> [!note]
> What stays in the browser: deploying a framework recipe, banning players, and txAdmin's own settings. Everything else you do from the Serverk panel.

## What you get from the first minute

- A clean FiveM server with the Cfx.re base resources: `mapmanager`, `chat`, `spawnmanager` and `basic-gamemode`.
- **txAdmin**, set up and bound to your server, under your own key.
- A **MariaDB** database running inside your server, with its details in the **Database** tab. This is what ESX and QBCore need.
- A `server.cfg` ready in `server-data`, editable from the file manager or from the Settings tab.

@[open](panel:database)

## Change your server settings

The **Settings** tab writes straight into `server.cfg`: server name, description, player slots, locale, tags, OneSync and the Steam Web API key.

@[open](panel:settings)

> [!warning]
> The free Cfx.re cap is 48 players. Above 48 needs an Element Club subscription on your Cfx.re account, and above 64 needs OneSync on — that subscription is yours, and has nothing to do with your Serverk plan.

## The lines we own

A few lines in `server.cfg` are rewritten by us on every install so your server keeps working:

- `endpoint_add_tcp` and `endpoint_add_udp` — your server's ports.
- `sv_licenseKey` — the key you saved in the panel.
- `set mysql_connection_string` — your database connection.
- `set sv_playersToken` — so the panel's player table can read real names.
- `set serverk_controlToken`, `ensure serverk` and `add_ace resource.serverk command` — so the console and the kick button work.

Anything you change on those lines is put back on the next install. The rest of the file is entirely yours.

## Next

Install a roleplay framework like ESX or QBCore from txAdmin in one click — the frameworks guide walks through it.
