import { describe, expect, test } from "bun:test";
import { preferredIdentifier, rosterOf } from "./fivemPlayers";

const PAYLOAD = [
	{
		endpoint: "127.0.0.1:30120",
		id: 1,
		identifiers: [
			"ip:127.0.0.1",
			"license:1234567890abcdef1234567890abcdef12345678",
			"steam:110000100000001",
			"discord:100000000000000000",
		],
		name: "Mohammed",
		ping: 34,
	},
	{
		endpoint: "10.0.0.2:30120",
		id: 2,
		identifiers: [
			"ip:10.0.0.2",
		],
		name: "خالد",
		ping: 0,
	},
	{
		endpoint: "10.0.0.3:30120",
		id: 3,
		identifiers: [],
		name: "Sara",
		ping: 88,
	},
];

describe("preferredIdentifier", () => {
	test("prefers license over everything else", () => {
		expect(
			preferredIdentifier([
				"ip:127.0.0.1",
				"discord:1",
				"license:abc",
			]),
		).toBe("license:abc");
	});

	test("falls back down the priority list", () => {
		expect(
			preferredIdentifier([
				"ip:127.0.0.1",
				"discord:1",
			]),
		).toBe("discord:1");
	});

	test("takes the first identifier when none are known", () => {
		expect(
			preferredIdentifier([
				"weird:1",
			]),
		).toBe("weird:1");
	});

	test("answers null for an empty list", () => {
		expect(preferredIdentifier([])).toBeNull();
	});
});

describe("rosterOf", () => {
	test("maps players.json into rows keyed on the stable identifier", () => {
		expect(rosterOf(PAYLOAD)).toEqual({
			count: 3,
			anonymous: false,
			entries: [
				{
					id: "license:1234567890abcdef1234567890abcdef12345678",
					name: "Mohammed",
					slot: 1,
					ping: 34,
				},
				{
					id: "ip:10.0.0.2",
					name: "خالد",
					slot: 2,
					ping: 0,
				},
				{
					id: "slot:3",
					name: "Sara",
					slot: 3,
					ping: 88,
				},
			],
		});
	});

	test("keeps the session id apart from the identity, so a reused slot is a new player", () => {
		const first = rosterOf([
			{
				id: 4,
				identifiers: [
					"license:aaaa",
				],
				name: "Mohammed",
			},
		]);

		const second = rosterOf([
			{
				id: 4,
				identifiers: [
					"license:bbbb",
				],
				name: "خالد",
			},
		]);

		expect(first.entries.at(0)?.slot).toBe(second.entries.at(0)?.slot);
		expect(first.entries.at(0)?.id).not.toBe(second.entries.at(0)?.id);
	});

	test("keeps a player with no name under their slot", () => {
		expect(
			rosterOf([
				{
					id: 7,
					identifiers: [],
				},
			]).entries.at(0),
		).toEqual({
			id: "slot:7",
			name: "#7",
			slot: 7,
			ping: null,
		});
	});

	test("drops an entry with no id", () => {
		expect(
			rosterOf([
				{
					name: "ghost",
				},
			]).entries,
		).toEqual([]);
	});

	test("accepts an id and a ping that arrive as strings", () => {
		expect(
			rosterOf([
				{
					id: "3",
					name: "Sara",
					ping: "12",
				},
			]).entries.at(0),
		).toEqual({
			id: "slot:3",
			name: "Sara",
			slot: 3,
			ping: 12,
		});
	});

	test("reads an anonymised roster as a count and no rows", () => {
		const roster = rosterOf([
			{
				endpoint: "127.0.0.1",
				id: 0,
				identifiers: [],
				name: "Player",
				ping: 0,
			},
			{
				endpoint: "127.0.0.1",
				id: 0,
				identifiers: [],
				name: "Player",
				ping: 0,
			},
		]);

		expect(roster.anonymous).toBe(true);
		expect(roster.count).toBe(2);
		expect(roster.entries).toEqual([]);
	});

	test("answers an empty roster for anything that is not an array", () => {
		expect(rosterOf(null).entries).toEqual([]);
		expect(rosterOf({}).anonymous).toBe(false);
		expect(rosterOf("[]").count).toBe(0);
	});
});
