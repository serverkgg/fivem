import { describe, expect, test } from "bun:test";
import {
	generateDatabasePassword,
	generatePanelPassword,
	generatePlayersToken,
	generateRconPassword,
	hashPassword,
	liveRconPassword,
} from "./fivemSecrets";

const TXADMIN_ACCOUNT_HASH = /^\$2[aby]\$[0-9]{2}\$[A-Za-z0-9./]{53}$/;

describe("fivem secrets", () => {
	test("every generated secret keeps its length", () => {
		expect(generateDatabasePassword()).toHaveLength(28);
		expect(generatePlayersToken()).toHaveLength(40);
		expect(generatePanelPassword()).toHaveLength(20);
		expect(generateRconPassword()).toHaveLength(24);
	});

	test("a generated secret carries no character the txhost env file would quote", () => {
		expect(generateDatabasePassword()).toMatch(/^[A-Za-z0-9]{28}$/);
	});
});

describe("liveRconPassword", () => {
	const generate = () => "generated";

	test("generates the first password when the stamp carries none", () => {
		expect(liveRconPassword("", "", generate)).toBe("generated");
	});

	test("keeps the live password when nothing is pending", () => {
		expect(liveRconPassword("live", "", generate)).toBe("live");
	});

	test("promotes a rotated password over the live one", () => {
		expect(liveRconPassword("live", "next", generate)).toBe("next");
		expect(liveRconPassword("", "next", generate)).toBe("next");
	});
});

describe("hashPassword", () => {
	test("hashes into the bcrypt shape TXHOST_DEFAULT_ACCOUNT refuses to boot without", async () => {
		expect(await hashPassword(generatePanelPassword())).toMatch(TXADMIN_ACCOUNT_HASH);
	});
});
