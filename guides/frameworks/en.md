## Why you need a framework

A clean FiveM server lets you spawn in and walk around, and that is all. Jobs, money, vehicles and identity all come from a roleplay framework. The big ones are **ESX**, **QBCore** and **Qbox**, and all of them run on a MySQL database.

That database is already running inside your server. Nothing to buy, nothing to install elsewhere.

@[open](panel:database)

## The official way: a txAdmin recipe

Every one of those frameworks documents txAdmin as its install path — ESX calls it "the recommended method", and QBCore and Qbox both ship a template in the same place. A recipe downloads the framework, drops the resources in, runs its SQL against your database and writes `server.cfg`, all in one click.

1. In the **Licence** tab of the Serverk panel, press **Open the setup page** on the txAdmin card.
2. Start the server, open the txAdmin address in your browser, and sign in as `serverk`.
3. Choose **Popular Recipe**, then the framework you want.
4. Your database details and your licence key arrive pre-filled from us. Check them and press deploy.
5. When the recipe finishes, come back to the Serverk panel and start the server.

@[open](panel:license)

> [!warning]
> "Open the setup page" sends txAdmin back to its setup page, which means the server will not start again until you finish the deploy in the browser. Your files and your database are not touched.

> [!note]
> After a recipe, your server runs from a new folder inside `txData`. The Serverk panel follows it on its own — settings, console, players and backups all keep working.

## Your database details

Open the **Database** tab and you will find:

- Host: `127.0.0.1`
- Port: `3306`
- Database: `fivem`
- User: `fivem`
- Password: generated for you, copy it from the tab
- A ready-made connection string for oxmysql

We also write that connection string into `server.cfg` on the `set mysql_connection_string` line, so scripts find it on their own.

> [!note]
> The database only listens on `127.0.0.1` inside your server. You cannot reach it from your own computer, and that is deliberate — it keeps your players' data off the internet.

## Running a SQL file yourself

If you install a resource that ships a `.sql` file, you can run it without a recipe:

1. Upload the file with the file manager, for example into `server-data`.
2. Open the **Database** tab, then **Import SQL**.
3. Give the file's path, such as `server-data/esx.sql`, and run it.

@[open](panel:database)

> [!warning]
> The server has to be running, because the database runs with it.

## Installing by hand

If you would rather not use a recipe, every framework needs something to talk to the database. The standard today is **oxmysql**:

1. Download the latest [oxmysql](https://github.com/overextended/oxmysql/releases) release.
2. Unzip it into `server-data/resources`.
3. Add this to `server.cfg`, above the framework:

```cfg
ensure oxmysql
```

@[open](files:server-data/server.cfg)

Then download `es_extended` or `qb-core`, drop it into `resources`, run its SQL files from the Database tab, and add its own `ensure` line. Make sure OneSync is on in the Settings tab — the frameworks will not run without it.

@[open](panel:settings)

## After any install

Once you add a resource, tell the server to rescan the folder:

@[command](refresh)

then:

@[command](restart oxmysql)

Or restart the whole server from the panel — easier and more reliable the first time.

## Backups

Every backup we take carries a **full dump of your database**, and txAdmin's own data with it. Restoring a backup brings your files straight back, and the database is one button away in the Database tab.

> [!warning]
> Restoring the database wipes everything written since that backup. Your players lose the money and vehicles they earned after it.

## Common problems

- **`Couldn't find resource`**: the folder name does not match the line in `server.cfg`. Names are case sensitive.
- **A script says it cannot reach the database**: check that `ensure oxmysql` sits above the framework in `server.cfg`, and that the connection string line is there.
- **Players cannot join**: usually OneSync is off, or the SQL files were never loaded.
