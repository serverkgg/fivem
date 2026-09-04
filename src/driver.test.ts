import { describe, expect, test } from "bun:test";
import { BridgeControl, BridgeDetailFormat, BridgeLayout, BridgeSetupStepKind } from "@serverkgg/bridge";
import { GuideOpenTab } from "@serverkgg/bridge/guides";
import { txadminStats } from "./details";
import { driver } from "./driver";
import { LICENSE_KEY_PATTERN, LICENSE_VARIABLE } from "./shared";

const modules = driver.modules ?? {};

const tabs = driver.panel?.tabs ?? [];

const sections = tabs.flatMap((tab) => tab.sections);

const steps = driver.setup?.steps ?? [];

const formSection = (tabId: string, sectionId: string) => {
	const tab = tabs.find((entry) => entry.id === tabId);
	const section = tab?.sections.find((entry) => entry.id === sectionId);

	return section?.layout === BridgeLayout.Form ? section : null;
};

const fieldOf = (tabId: string, sectionId: string, key: string) => {
	return formSection(tabId, sectionId)?.fields.find((field) => field.key === key) ?? null;
};

describe("walking the customer through the first run", () => {
	test("asks for the key and its verification before anything optional", () => {
		expect(steps.map((step) => step.id)).toEqual([
			"license",
			"verify",
			"txadmin",
			"name",
			"invite",
		]);
	});

	test("blocks the flow on the two steps a fivem server cannot run without", () => {
		expect(steps.filter((step) => step.required !== false).map((step) => step.id)).toEqual([
			"license",
			"verify",
		]);
	});

	test("verifies the licence from the driver itself, and only while the server runs", () => {
		const verify = steps.find((step) => step.id === "verify");

		expect(verify?.kind).toBe(BridgeSetupStepKind.Driver);
		expect(verify?.kind === BridgeSetupStepKind.Driver && verify.requiresRunning).toBe(true);
	});

	test("answers the driver step's buttons, which the bridge requires of any driver step", () => {
		expect(driver.setup?.submit).toBeDefined();
	});

	test("points every form step at a form section the panel really declares", () => {
		for (const step of steps) {
			if (step.kind !== BridgeSetupStepKind.Form) {
				continue;
			}

			expect(formSection(step.tab, step.section)).not.toBeNull();
		}
	});

	test("names only fields that section really carries", () => {
		for (const step of steps) {
			if (step.kind !== BridgeSetupStepKind.Form) {
				continue;
			}

			const keys = (formSection(step.tab, step.section)?.fields ?? []).map((field) => field.key);

			for (const key of step.fields ?? []) {
				expect(keys).toContain(key);
			}
		}
	});

	test("sends the txadmin step to a panel tab the panel really has", () => {
		const txadmin = steps.find((step) => step.id === "txadmin");
		const target = txadmin?.kind === BridgeSetupStepKind.Open ? txadmin.target : null;

		expect(target?.tab).toBe(GuideOpenTab.Panel);
		expect(tabs.map((tab) => tab.id)).toContain(target?.tab === GuideOpenTab.Panel ? target.tabId : "");
	});

	test("sends the invite step to the access page, where the address lives", () => {
		const invite = steps.find((step) => step.id === "invite");

		expect(invite?.kind === BridgeSetupStepKind.Open && invite.target.tab).toBe(GuideOpenTab.Access);
	});

	test("titles and explains every step in both arabic and english", () => {
		for (const step of steps) {
			expect(step.title.ar.length).toBeGreaterThan(0);
			expect(step.title.en.length).toBeGreaterThan(0);
			expect(step.help?.ar.length).toBeGreaterThan(0);
			expect(step.help?.en.length).toBeGreaterThan(0);
		}
	});
});

describe("keeping the customer's own secrets out of everyone else's hands", () => {
	test("collects the licence key as a secret", () => {
		expect(fieldOf("license", "license", LICENSE_VARIABLE)?.control).toBe(BridgeControl.Secret);
	});

	test("refuses a licence key the container would fatal-error on, with the same rule the driver uses", () => {
		expect(fieldOf("license", "license", LICENSE_VARIABLE)?.pattern).toBe(LICENSE_KEY_PATTERN.source);
	});

	test("explains the shape of a key in both arabic and english when one is refused", () => {
		const hint = fieldOf("license", "license", LICENSE_VARIABLE)?.patternHint;

		expect(hint?.ar.length).toBeGreaterThan(0);
		expect(hint?.en.length).toBeGreaterThan(0);
	});

	test("collects the steam web api key as a secret", () => {
		expect(fieldOf("settings", "server", "steam_webApiKey")?.control).toBe(BridgeControl.Secret);
	});

	test("hides the txadmin password from anyone who cannot act on the panel", () => {
		const stats = txadminStats("secret", 40_120, "server-data");

		expect(stats.find((stat) => stat.key === "password")?.format).toBe(BridgeDetailFormat.Secret);
	});
});

describe("assembling the fivem driver", () => {
	test("declares the setup flow the licence key needs", () => {
		expect(driver.setup).toBeDefined();
	});

	test("keeps the setup singleton out of the panel modules, because its id is reserved", () => {
		expect(Object.keys(modules)).not.toContain("setup");
	});

	test("registers every module the panel binds a section to", () => {
		for (const section of sections) {
			if (section.layout !== BridgeLayout.Form) {
				expect(Object.keys(modules)).toContain(section.module);
			}
		}
	});
});
