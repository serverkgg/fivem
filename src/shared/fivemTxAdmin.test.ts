import { describe, expect, test } from "bun:test";
import {
	accountOf,
	clearedConfigFile,
	environmentFile,
	onesyncOf,
	serverPathsOf,
	txAdminConfigFile,
	withOnesync,
} from "./fivemTxAdmin";

const ENVIRONMENT = {
	dataPath: "txData",
	txAdminPort: 40_120,
	gamePort: 30_120,
	maxSlots: 48,
	licenseKey: "cfxk_abcdefghijklmnopqrstu_123456",
	account: "serverk::$2b$11$K3HwDzkoUfhU6.W.tScfhOLEtR5uNc9qpQ685emtERx3dZ7fmgXCy",
	controlToken: "token",
	databaseHost: "127.0.0.1",
	databasePort: 3306,
	databaseUser: "fivem",
	databasePassword: "abc123",
	databaseName: "fivem",
};

const lineOf = (file: string, key: string) => {
	return file.split("\n").find((line) => line.startsWith(`${key}=`)) ?? null;
};

describe("txAdminConfigFile", () => {
	test("names the server data path txAdmin needs before it will auto start", () => {
		expect(serverPathsOf(txAdminConfigFile("سيرفر abc123"))).toEqual({
			dataPath: "server-data",
			cfgPath: "server-data/server.cfg",
		});
	});
});

describe("serverPathsOf", () => {
	test("follows a recipe the owner deployed from the txAdmin setup page", () => {
		const raw = JSON.stringify({
			version: 2,
			server: {
				dataPath: "/home/container/txData/ESXLegacy_A1B2C3",
				cfgPath: "server.cfg",
			},
		});

		expect(serverPathsOf(raw)).toEqual({
			dataPath: "txData/ESXLegacy_A1B2C3",
			cfgPath: "txData/ESXLegacy_A1B2C3/server.cfg",
		});
	});

	test("accepts an absolute cfg path", () => {
		const raw = JSON.stringify({
			server: {
				dataPath: "/home/container/server-data",
				cfgPath: "/home/container/server-data/live.cfg",
			},
		});

		expect(serverPathsOf(raw)?.cfgPath).toBe("server-data/live.cfg");
	});

	test("answers null while txAdmin is still waiting for its setup page", () => {
		expect(
			serverPathsOf(
				JSON.stringify({
					version: 2,
					server: {},
				}),
			),
		).toBeNull();
		expect(serverPathsOf("not json")).toBeNull();
	});

	test("answers null for a path outside the volume", () => {
		expect(
			serverPathsOf(
				JSON.stringify({
					server: {
						dataPath: "/opt/elsewhere",
					},
				}),
			),
		).toBeNull();
	});
});

describe("clearedConfigFile", () => {
	test("drops the data path and keeps everything else", () => {
		const raw = JSON.stringify({
			version: 2,
			general: {
				serverName: "city",
			},
			server: {
				dataPath: "/home/container/server-data",
				cfgPath: "server.cfg",
			},
		});

		const cleared = clearedConfigFile(raw);

		expect(cleared).not.toBeNull();
		expect(serverPathsOf(cleared ?? "")).toBeNull();
		expect(JSON.parse(cleared ?? "").general.serverName).toBe("city");
		expect(JSON.parse(cleared ?? "").server.cfgPath).toBe("server.cfg");
	});

	test("answers null for a file it cannot read", () => {
		expect(clearedConfigFile("{")).toBeNull();
	});
});

describe("environmentFile", () => {
	test("quotes every value so a bcrypt hash survives being sourced", () => {
		const file = environmentFile(ENVIRONMENT);

		expect(lineOf(file, "TXHOST_DEFAULT_ACCOUNT")).toBe(
			"TXHOST_DEFAULT_ACCOUNT='serverk::$2b$11$K3HwDzkoUfhU6.W.tScfhOLEtR5uNc9qpQ685emtERx3dZ7fmgXCy'",
		);
	});

	test("carries the ports, the data path and the provider", () => {
		const file = environmentFile(ENVIRONMENT);

		expect(lineOf(file, "TXHOST_DATA_PATH")).toBe("TXHOST_DATA_PATH='/home/container/txData'");
		expect(lineOf(file, "TXHOST_TXA_PORT")).toBe("TXHOST_TXA_PORT='40120'");
		expect(lineOf(file, "TXHOST_FXS_PORT")).toBe("TXHOST_FXS_PORT='30120'");
		expect(lineOf(file, "TXHOST_GAME_NAME")).toBe("TXHOST_GAME_NAME='fivem'");
		expect(lineOf(file, "TXHOST_MAX_SLOTS")).toBe("TXHOST_MAX_SLOTS='48'");
		expect(lineOf(file, "TXHOST_INTERFACE")).toBe("TXHOST_INTERFACE='0.0.0.0'");
		expect(lineOf(file, "TXHOST_PROVIDER_NAME")).toBe("TXHOST_PROVIDER_NAME='Serverk'");
		expect(lineOf(file, "TXHOST_QUIET_MODE")).toBe("TXHOST_QUIET_MODE='false'");
	});

	test("leaves the cfx key out while the owner has not pasted one", () => {
		const file = environmentFile({
			...ENVIRONMENT,
			licenseKey: null,
		});

		expect(lineOf(file, "TXHOST_DEFAULT_CFXKEY")).toBeNull();
	});
});

describe("accountOf", () => {
	test("writes the username:fivemId:hash shape with no fivem id", () => {
		expect(accountOf("serverk", "$2b$11$hash")).toBe("serverk::$2b$11$hash");
	});
});

describe("onesync", () => {
	test("reads the profile txAdmin actually starts the server with", () => {
		expect(onesyncOf(txAdminConfigFile("city"))).toBe(true);
		expect(
			onesyncOf(
				JSON.stringify({
					server: {
						onesync: "off",
					},
				}),
			),
		).toBe(false);
		expect(
			onesyncOf(
				JSON.stringify({
					server: {},
				}),
			),
		).toBeNull();
		expect(onesyncOf("{")).toBeNull();
	});

	test("writes the toggle back without losing the rest of the profile", () => {
		const written = withOnesync(txAdminConfigFile("city"), false);

		expect(onesyncOf(written ?? "")).toBe(false);
		expect(serverPathsOf(written ?? "")?.dataPath).toBe("server-data");
		expect(withOnesync("{", true)).toBeNull();
	});
});
