import { describe, expect, test } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { emptyConfigFile, TXADMIN_CONFIG_FILE, TXADMIN_PROFILE_DIRECTORY, txAdminConfigFile } from "../shared";
import { seedTxAdminProfile } from "./installTxAdmin";

const LICENSE_KEY = "cfxk_1a2b3c4d5e6f7g8h9i0j1_zz9xk2";

const contextWith = (files: Record<string, string>) => {
	const written: Record<string, string> = {};
	const directories: string[] = [];

	const context = {
		server: {
			code: "abc123def4",
		},

		files: {
			async exists(path: string) {
				return Object.hasOwn(files, path) || Object.hasOwn(written, path) || directories.includes(path);
			},

			async read(path: string) {
				return written[path] ?? files[path] ?? "";
			},

			async write(path: string, content: string) {
				written[path] = content;
			},

			async ensure(...paths: string[]) {
				directories.push(...paths);
			},
		},

		log: Object.assign(
			() => {
				return;
			},
			{
				warn: () => {
					return;
				},
			},
		),
	};

	return {
		context: context as unknown as Bridge.Context,
		written,
	};
};

describe("seeding the txadmin profile", () => {
	test("writes the first profile when there is a licence key and no profile", async () => {
		const { context, written } = contextWith({});

		expect(await seedTxAdminProfile(context, LICENSE_KEY, false)).toBe(true);
		expect(written[TXADMIN_CONFIG_FILE]).toBe(txAdminConfigFile("سيرفر abc123def4"));
	});

	test("leaves a profile the owner already owns alone", async () => {
		const { context, written } = contextWith({
			[TXADMIN_CONFIG_FILE]: txAdminConfigFile("theirs"),
		});

		expect(await seedTxAdminProfile(context, LICENSE_KEY, true)).toBe(true);
		expect(written[TXADMIN_CONFIG_FILE]).toBeUndefined();
	});

	test("leaves the cleared profile the setup-page action wrote alone", async () => {
		const { context, written } = contextWith({
			[TXADMIN_CONFIG_FILE]: emptyConfigFile(),
		});

		expect(await seedTxAdminProfile(context, LICENSE_KEY, true)).toBe(true);
		expect(written[TXADMIN_CONFIG_FILE]).toBeUndefined();
	});

	// reset.keep spares .serverk-install.json and wipes txData, so the stamp's
	// memory of a seeded profile outlives the profile. Trusting it there leaves
	// txAdmin on its setup page with no way back.
	test("writes a new profile when a wipe took the profile the stamp remembers", async () => {
		const { context, written } = contextWith({});

		expect(await seedTxAdminProfile(context, LICENSE_KEY, true)).toBe(true);
		expect(written[TXADMIN_CONFIG_FILE]).toContain("dataPath");
	});

	test("writes nothing but an empty profile while no licence key is saved", async () => {
		const { context, written } = contextWith({});

		expect(await seedTxAdminProfile(context, null, true)).toBe(false);
		expect(written[TXADMIN_CONFIG_FILE]).toBeUndefined();
	});

	test("gives txadmin a config to boot from when its profile folder outlived its config", async () => {
		const { context, written } = contextWith({
			[TXADMIN_PROFILE_DIRECTORY]: "",
		});

		expect(await seedTxAdminProfile(context, null, true)).toBe(false);
		expect(written[TXADMIN_CONFIG_FILE]).toBe(emptyConfigFile());
	});
});
