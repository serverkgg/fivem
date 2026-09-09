import { describe, expect, test } from "bun:test";
import { presenceOf } from "./fivemRoster";

describe("the presence payload a join, a leave and a kick all carry", () => {
	test("names the identity under the manifest's presence id and the slot beside it", () => {
		expect(
			presenceOf({
				id: "license:1234567890abcdef1234567890abcdef12345678",
				name: "Mohammed",
				slot: 1,
				ping: 34,
			}),
		).toEqual({
			player: "Mohammed",
			identifier: "license:1234567890abcdef1234567890abcdef12345678",
			slot: "1",
			ping: "34",
		});
	});

	test("leaves the ping out when the server did not report one", () => {
		expect(
			presenceOf({
				id: "slot:3",
				name: "Sara",
				slot: 3,
				ping: null,
			}),
		).toEqual({
			player: "Sara",
			identifier: "slot:3",
			slot: "3",
		});
	});
});
