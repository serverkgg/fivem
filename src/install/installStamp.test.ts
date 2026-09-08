import { describe, expect, test } from "bun:test";
import { parseStamp } from "@serverkgg/bridge/install";
import { stampOf } from "./installStamp";

describe("stampOf", () => {
	test("carries a full stamp through unchanged", () => {
		expect(
			stampOf({
				build: "12913",
				reference: "12913-abcdef",
				databasePassword: "database",
				playersToken: "players",
				controlToken: "control",
				panelPassword: "panel",
				profileSeeded: true,
			}),
		).toEqual({
			build: "12913",
			reference: "12913-abcdef",
			databasePassword: "database",
			playersToken: "players",
			controlToken: "control",
			panelPassword: "panel",
			profileSeeded: true,
		});
	});

	test("keeps a stamp written before the txadmin fields existed", () => {
		expect(
			stampOf(
				parseStamp(
					JSON.stringify({
						build: "12913",
						reference: "12913-abcdef",
						databasePassword: "database",
						playersToken: "players",
					}),
				),
			),
		).toEqual({
			build: "12913",
			reference: "12913-abcdef",
			databasePassword: "database",
			playersToken: "players",
			controlToken: "",
			panelPassword: "",
			profileSeeded: false,
		});
	});

	test("reads a stamp with no build or reference as no stamp", () => {
		expect(
			stampOf({
				databasePassword: "database",
			}),
		).toBeNull();

		expect(
			stampOf({
				build: "12913",
				reference: "",
			}),
		).toBeNull();

		expect(stampOf(null)).toBeNull();
	});

	test("reads a value of the wrong type as missing", () => {
		expect(
			stampOf({
				build: "12913",
				reference: "12913-abcdef",
				databasePassword: 4,
				profileSeeded: "yes",
			}),
		).toEqual({
			build: "12913",
			reference: "12913-abcdef",
			databasePassword: "",
			playersToken: "",
			controlToken: "",
			panelPassword: "",
			profileSeeded: false,
		});
	});
});
