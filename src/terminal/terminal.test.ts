import { describe, expect, test } from "bun:test";
import { terminal } from "./terminal";

const commandNamed = (name: string) => {
	return terminal.commands?.find((command) => command.name === name) ?? null;
};

describe("completing a player argument in the console", () => {
	test("offers the session slot serverk_kick addresses, not the identifier the roster is keyed on", () => {
		const argument = commandNamed("serverk_kick")?.args?.at(0);

		expect(argument?.module).toBe("players");
		expect(argument?.column).toBe("slot");
	});
});
