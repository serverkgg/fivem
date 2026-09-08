import { describe, expect, test } from "bun:test";
import { BridgeUserError } from "@serverkgg/bridge";
import { sqlClientCommand, sqlFailureReason, sqlPathArgument } from "./fivemDump";

const CLIENT = "/home/container/.mariadb/serverk-client.cnf";

const FILE = "/home/container/server-data/esx.sql";

describe("running a sql file against the database", () => {
	test("feeds the file on stdin rather than through the client's own source command", () => {
		const command = sqlClientCommand(CLIENT, FILE, "fivem");

		expect(command.at(0)).toBe("sh");
		expect(command.join(" ")).not.toContain("source");
		expect(command.at(2)).toContain('< "$2"');
	});

	test("passes every path positionally so a path is never read as shell", () => {
		const command = sqlClientCommand(CLIENT, FILE, "fivem");

		expect(command.slice(3)).toEqual([
			"sh",
			CLIENT,
			FILE,
			"fivem",
		]);
		expect(command.at(2)).not.toContain(FILE);
	});

	test("leaves the database out when the dump names its own", () => {
		const command = sqlClientCommand(CLIENT, FILE, null);

		expect(command.slice(3)).toEqual([
			"sh",
			CLIENT,
			FILE,
		]);
		expect(command.at(2)).not.toContain("$3");
	});
});

describe("telling the customer why their sql file failed", () => {
	test("picks the diagnosis out of the statement the client echoes before it", () => {
		expect(
			sqlFailureReason(
				[
					"--------------",
					"CREATE TABLE broken (id INT PRIMARY KEY",
					"--------------",
					"",
					"ERROR 1064 (42000) at line 1: You have an error in your SQL syntax",
				].join("\n"),
			),
		).toBe("ERROR 1064 (42000) at line 1: You have an error in your SQL syntax");
	});

	test("falls back to the last line when the client says something else", () => {
		expect(sqlFailureReason("mariadb: could not reach the server\n")).toBe("mariadb: could not reach the server");
	});

	test("bounds the message so a client that writes an essay never reaches the panel", () => {
		expect(sqlFailureReason(`ERROR 1064 ${"x".repeat(500)}`).length).toBe(200);
	});
});

describe("naming a sql file inside the server", () => {
	test("takes a path under the server root", () => {
		expect(sqlPathArgument(" /server-data/esx.sql ")).toBe("server-data/esx.sql");
	});

	test("refuses anything that is not a .sql file, and anything that climbs out", () => {
		for (const value of [
			"server-data/notes.txt",
			"../etc/passwd.sql",
			"",
		]) {
			expect(() => sqlPathArgument(value)).toThrow(BridgeUserError);
		}
	});
});
