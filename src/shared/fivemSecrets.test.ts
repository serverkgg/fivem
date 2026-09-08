import { describe, expect, test } from "bun:test";
import { generateDatabasePassword, generatePanelPassword, generatePlayersToken, hashPassword } from "./fivemSecrets";

const TXADMIN_ACCOUNT_HASH = /^\$2[aby]\$[0-9]{2}\$[A-Za-z0-9./]{53}$/;

describe("fivem secrets", () => {
	test("every generated secret keeps its length", () => {
		expect(generateDatabasePassword()).toHaveLength(28);
		expect(generatePlayersToken()).toHaveLength(40);
		expect(generatePanelPassword()).toHaveLength(20);
	});

	test("a generated secret carries no character the txhost env file would quote", () => {
		expect(generateDatabasePassword()).toMatch(/^[A-Za-z0-9]{28}$/);
	});
});

describe("hashPassword", () => {
	test("hashes into the bcrypt shape TXHOST_DEFAULT_ACCOUNT refuses to boot without", async () => {
		expect(await hashPassword(generatePanelPassword())).toMatch(TXADMIN_ACCOUNT_HASH);
	});
});
