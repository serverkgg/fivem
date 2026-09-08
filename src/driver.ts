import type { BridgeDriver } from "@serverkgg/bridge";
import { databaseTools, live } from "./actions";
import { announce } from "./announce";
import { backup } from "./backup";
import { players } from "./collections";
import { database, rconAccess, txadmin } from "./details";
import { events } from "./events";
import { install } from "./install";
import { lifecycle } from "./lifecycle";
import { artifact } from "./options";
import { panel } from "./panel";
import { query } from "./query";
import { settings } from "./settings";
import { setup } from "./setup";
import { terminal } from "./terminal";

export const driver: BridgeDriver = {
	install,
	lifecycle,
	events,
	query,
	backup,
	announce,
	setup,
	terminal,
	panel,
	modules: {
		artifact,
		settings,
		players,
		database,
		databaseTools,
		txadmin,
		live,
		rconAccess,
	},
};
