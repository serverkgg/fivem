import { absolutePath, SERVER_CONFIG_NAME, SERVER_DATA_DIRECTORY, volumePath } from "./fivemPaths";

export const TXADMIN_PORT = "txadmin";

export const TXADMIN_DATA_DIRECTORY = "txData";

export const TXADMIN_PROFILE = "default";

export const TXADMIN_PROFILE_DIRECTORY = `${TXADMIN_DATA_DIRECTORY}/${TXADMIN_PROFILE}`;

export const TXADMIN_CONFIG_FILE = `${TXADMIN_PROFILE_DIRECTORY}/config.json`;

export const TXADMIN_ADMINS_FILE = `${TXADMIN_DATA_DIRECTORY}/admins.json`;

export const TXADMIN_ENVIRONMENT_FILE = ".serverk-txhost.env";

export const TXADMIN_USERNAME = "serverk";

export const TXADMIN_PROVIDER = "Serverk";

// core/modules/ConfigStore/index.ts pins CONFIG_VERSION at 2; a file written
// with an older version is migrated by txAdmin itself on the next boot.
const CONFIG_VERSION = 2;

export interface TxAdminServerPaths {
	dataPath: string;
	cfgPath: string;
}

export const DEFAULT_SERVER_PATHS: TxAdminServerPaths = {
	dataPath: SERVER_DATA_DIRECTORY,
	cfgPath: `${SERVER_DATA_DIRECTORY}/${SERVER_CONFIG_NAME}`,
};

// What core/boot/setup.ts writes for a brand new profile: enough for txAdmin to
// boot into its own setup page rather than fatal-error on a missing file.
export const emptyConfigFile = () => {
	return `${JSON.stringify(
		{
			version: CONFIG_VERSION,
		},
		null,
		2,
	)}\n`;
};

export const txAdminConfigFile = (serverName: string) => {
	return `${JSON.stringify(
		{
			version: CONFIG_VERSION,
			general: {
				serverName,
			},
			server: {
				dataPath: absolutePath(SERVER_DATA_DIRECTORY),
				cfgPath: SERVER_CONFIG_NAME,
				onesync: "on",
				autoStart: true,
				quiet: false,
				// A rejected licence key makes FXServer exit on every spawn, and
				// txAdmin respawns it as soon as it closes. Five seconds keeps a
				// wrong key from filling the console rather than changing how a
				// healthy restart behaves.
				restartSpawnDelayMs: 5000,
			},
		},
		null,
		2,
	)}\n`;
};

const readText = (value: unknown): string | null => {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
};

// txAdmin resolves a relative cfgPath against the data path and an absolute one
// as given, which is what core/lib/fxserver/fxsConfigHelper.ts does at spawn.
export const serverPathsOf = (raw: string): TxAdminServerPaths | null => {
	let parsed: unknown;

	try {
		parsed = JSON.parse(raw);
	} catch {
		return null;
	}

	if (parsed === null || typeof parsed !== "object") {
		return null;
	}

	const server = (
		parsed as {
			server?: unknown;
		}
	).server;

	if (server === null || typeof server !== "object") {
		return null;
	}

	const declaredData = readText(
		(
			server as {
				dataPath?: unknown;
			}
		).dataPath,
	);

	if (declaredData === null) {
		return null;
	}

	const dataPath = volumePath(declaredData);

	if (dataPath === null) {
		return null;
	}

	const declaredCfg =
		readText(
			(
				server as {
					cfgPath?: unknown;
				}
			).cfgPath,
		) ?? SERVER_CONFIG_NAME;
	const cfgPath = declaredCfg.startsWith("/") ? volumePath(declaredCfg) : `${dataPath}/${declaredCfg}`;

	if (cfgPath === null) {
		return null;
	}

	return {
		dataPath,
		cfgPath,
	};
};

export const clearedConfigFile = (raw: string): string | null => {
	let parsed: unknown;

	try {
		parsed = JSON.parse(raw);
	} catch {
		return null;
	}

	if (parsed === null || typeof parsed !== "object") {
		return null;
	}

	const config = parsed as Record<string, unknown>;
	const server =
		config.server === null || typeof config.server !== "object"
			? {}
			: {
					...config.server,
				};

	delete (server as Record<string, unknown>).dataPath;

	return `${JSON.stringify(
		{
			...config,
			server,
		},
		null,
		2,
	)}\n`;
};

export const ONESYNC_SETTING = "onesync";

const ONESYNC_ON = "on";

const ONESYNC_OFF = "off";

const parsed = (raw: string): Record<string, unknown> | null => {
	try {
		const value: unknown = JSON.parse(raw);

		return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
	} catch {
		return null;
	}
};

// txAdmin's cfg validator comments any `set onesync` line out of server.cfg and
// passes its own `+set onesync` from the profile instead, so the profile is
// where the toggle has to land for it to mean anything.
export const onesyncOf = (raw: string): boolean | null => {
	const server = parsed(raw)?.server;

	if (server === null || typeof server !== "object") {
		return null;
	}

	const value = (
		server as {
			onesync?: unknown;
		}
	).onesync;

	return typeof value === "string" ? value !== ONESYNC_OFF : null;
};

export const withOnesync = (raw: string, enabled: boolean): string | null => {
	const config = parsed(raw);

	if (config === null) {
		return null;
	}

	const server =
		config.server === null || typeof config.server !== "object"
			? {}
			: {
					...config.server,
				};

	return `${JSON.stringify(
		{
			...config,
			server: {
				...server,
				onesync: enabled ? ONESYNC_ON : ONESYNC_OFF,
			},
		},
		null,
		2,
	)}\n`;
};

export interface TxAdminEnvironment {
	dataPath: string;
	txAdminPort: number;
	gamePort: number;
	maxSlots: number;
	licenseKey: string | null;
	account: string | null;
	controlToken: string;
	databasePassword: string;
	databaseHost: string;
	databasePort: number;
	databaseUser: string;
	databaseName: string;
}

const QUOTABLE = /^[\w./$@:+=,-]*$/;

export const environmentFile = (environment: TxAdminEnvironment) => {
	const values: [
		string,
		string,
	][] = [
		[
			"TXHOST_DATA_PATH",
			absolutePath(environment.dataPath),
		],
		[
			"TXHOST_GAME_NAME",
			"fivem",
		],
		[
			"TXHOST_MAX_SLOTS",
			String(environment.maxSlots),
		],
		[
			"TXHOST_QUIET_MODE",
			"false",
		],
		[
			"TXHOST_TXA_PORT",
			String(environment.txAdminPort),
		],
		[
			"TXHOST_FXS_PORT",
			String(environment.gamePort),
		],
		[
			"TXHOST_INTERFACE",
			"0.0.0.0",
		],
		[
			"TXHOST_PROVIDER_NAME",
			TXADMIN_PROVIDER,
		],
		[
			"TXHOST_DEFAULT_DBHOST",
			environment.databaseHost,
		],
		[
			"TXHOST_DEFAULT_DBPORT",
			String(environment.databasePort),
		],
		[
			"TXHOST_DEFAULT_DBUSER",
			environment.databaseUser,
		],
		[
			"TXHOST_DEFAULT_DBPASS",
			environment.databasePassword,
		],
		[
			"TXHOST_DEFAULT_DBNAME",
			environment.databaseName,
		],
		// Not a txAdmin variable: start.sh reads it to forward the panel
		// console into the game server over the [serverk] resource.
		[
			"SERVERK_CONTROL_TOKEN",
			environment.controlToken,
		],
	];

	if (environment.licenseKey !== null) {
		values.push([
			"TXHOST_DEFAULT_CFXKEY",
			environment.licenseKey,
		]);
	}

	if (environment.account !== null) {
		values.push([
			"TXHOST_DEFAULT_ACCOUNT",
			environment.account,
		]);
	}

	// start.sh sources this file, so a value carrying a quote or a space would
	// change how the shell reads the line rather than fail loudly.
	const lines = values.filter(([, value]) => QUOTABLE.test(value)).map(([key, value]) => `${key}='${value}'`);

	return `${lines.join("\n")}\n`;
};

export const accountOf = (username: string, passwordHash: string) => {
	return `${username}::${passwordHash}`;
};
