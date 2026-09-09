import { describe, expect, test } from "bun:test";
import { type Bridge, BridgeUserError } from "@serverkgg/bridge";
import { players } from "./players";

const contextWith = (
	sent: string[],
	emitted: Array<
		[
			string,
			Bridge.Values,
		]
	>,
) => {
	return {
		command: async (input: string) => {
			sent.push(input);

			return {
				sent: input,
				line: null,
				groups: {},
			};
		},
		emit: (name: string, payload: Bridge.Values) => {
			emitted.push([
				name,
				payload,
			]);
		},
	} as unknown as Bridge.Context;
};

const kick = async (row: Bridge.Row) => {
	const sent: string[] = [];
	const emitted: Array<
		[
			string,
			Bridge.Values,
		]
	> = [];

	await players.actions?.kick?.(contextWith(sent, emitted), row, {});

	return {
		sent,
		emitted,
	};
};

describe("kicking a player off the server", () => {
	test("addresses the session slot rather than the identifier the row is keyed on", async () => {
		const { sent, emitted } = await kick({
			id: "license:1234567890abcdef1234567890abcdef12345678",
			name: "Mohammed",
			slot: 7,
			ping: 34,
		});

		expect(sent).toEqual([
			"serverk_kick 7 You were removed by an admin.",
		]);
		expect(emitted).toEqual([
			[
				"PlayerKicked",
				{
					player: "Mohammed",
					identifier: "license:1234567890abcdef1234567890abcdef12345678",
					slot: "7",
				},
			],
		]);
	});

	test("falls back to the row id when the row carries no name", async () => {
		const { emitted } = await kick({
			id: "slot:3",
			name: "",
			slot: 3,
		});

		expect(emitted.at(0)?.at(1)).toEqual({
			player: "slot:3",
			identifier: "slot:3",
			slot: "3",
		});
	});

	test("accepts a slot that arrives as a string over the wire", async () => {
		const { sent } = await kick({
			id: "slot:12",
			name: "Sara",
			slot: "12",
		});

		expect(sent).toEqual([
			"serverk_kick 12 You were removed by an admin.",
		]);
	});

	test.each([
		[
			"a missing slot",
			null,
		],
		[
			"a slot that is not a number",
			"3; quit",
		],
		[
			"the anonymised slot 0",
			0,
		],
		[
			"a fractional slot",
			1.5,
		],
	])("refuses to build a command from %s", async (_case, slot) => {
		expect(
			kick({
				id: "slot:1",
				name: "Mohammed",
				slot,
			}),
		).rejects.toBeInstanceOf(BridgeUserError);
	});
});
