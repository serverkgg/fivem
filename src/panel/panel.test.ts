import { describe, expect, test } from "bun:test";
import { BridgeLayout, BridgePlace } from "@serverkgg/bridge";
import type { BridgeSection } from "@serverkgg/bridge/protocol";
import { panel } from "./panel";

const placeOf = (section: BridgeSection | null | undefined) => {
	return section && "place" in section ? section.place : undefined;
};

const tabs = panel.tabs;

const sections = tabs.flatMap((tab) => tab.sections);

const sectionNamed = (id: string) => {
	return sections.find((section) => section.id === id) ?? null;
};

const tableNamed = (id: string) => {
	const section = sectionNamed(id);

	return section?.layout === BridgeLayout.Table ? section : null;
};

describe("the roster the platform players page renders", () => {
	test("hands the online table to the players page instead of a tab of its own", () => {
		expect(placeOf(tableNamed("online"))).toBe(BridgePlace.Players);
		expect(tabs.find((tab) => tab.id === "players")?.sections.every((section) => placeOf(section) !== undefined)).toBe(
			true,
		);
	});

	test("keeps the roster tab titled the way every other game titles it", () => {
		expect(tabs.find((tab) => tab.id === "players")?.title).toEqual({
			ar: "اللاعبين",
			en: "Players",
		});
	});

	test("shows the name, the session slot and the ping, and never the identifier the row is keyed on", () => {
		expect(tableNamed("online")?.columns.map((column) => column.key)).toEqual([
			"name",
			"slot",
			"ping",
		]);
	});

	test("offers kick alone, because vanilla fxserver has no ban of its own", () => {
		expect(tableNamed("online")?.actions?.map((action) => action.id)).toEqual([
			"kick",
		]);
	});

	test("says where banning lives, in both arabic and english", () => {
		const help = tableNamed("online")?.help;

		expect(help?.ar).toContain("txAdmin");
		expect(help?.en).toContain("txAdmin");
	});
});

describe("the credentials cards fivem shows beside its live sections", () => {
	test("leaves txadmin and the database on their tabs, because neither is a live metric", () => {
		expect(placeOf(sectionNamed("txadmin"))).toBeUndefined();
		expect(placeOf(sectionNamed("mariadb"))).toBeUndefined();
	});
});

// rcon-access is the shared section rconAccessSections builds, and it explains
// itself on its one field instead of above it.
const OWN_FORM_IDS = [
	"license",
	"server",
];

describe("explaining every form before its fields", () => {
	test("carries one line in both languages on each form this package declares", () => {
		for (const id of OWN_FORM_IDS) {
			const section = sectionNamed(id);

			expect(section?.layout).toBe(BridgeLayout.Form);
			expect(section?.help?.ar.length).toBeGreaterThan(0);
			expect(section?.help?.en.length).toBeGreaterThan(0);
		}
	});
});
