import { describe, expect, test } from "bun:test";
import { type Bridge, BridgeSetupPromptKind, BridgeSetupStepState } from "@serverkgg/bridge";
import { LICENSE_CHECKING, LICENSE_INVALID, LICENSE_REJECTED, SERVER_READY } from "../events";
import { LICENSE_VARIABLE } from "../shared";
import {
	checkLicence,
	FivemSetupPhase,
	outcomeOf,
	RETRY_ACTION,
	runtimeOf,
	startingRuntime,
	tailOutcome,
	VERIFY_STEP,
} from "./setupFlow";

const READY_LINE = "Server license key authentication succeeded. Welcome!";

const REJECTED_LINE = "Could not authenticate server license key. The specified key does not exist.";

const CHECKING_LINE = "Authenticating server license key...";

const stateOf = (phase: FivemSetupPhase) => {
	return runtimeOf(phase).steps.at(0)?.state;
};

const promptOf = (phase: FivemSetupPhase) => {
	return runtimeOf(phase).prompt;
};

describe("telling the customer where the licence check stands", () => {
	test("reports the one driver step the setup declares, and nothing else", () => {
		for (const phase of Object.values(FivemSetupPhase)) {
			expect(runtimeOf(phase).steps.map((step) => step.id)).toEqual([
				VERIFY_STEP,
			]);
		}
	});

	test("leaves the check pending and offers a retry while no key is saved", () => {
		expect(stateOf(FivemSetupPhase.MissingKey)).toBe(BridgeSetupStepState.Pending);

		const prompt = promptOf(FivemSetupPhase.MissingKey);

		expect(prompt?.kind).toBe(BridgeSetupPromptKind.Action);
		expect(prompt?.kind === BridgeSetupPromptKind.Action && prompt.actions.map((action) => action.id)).toEqual([
			RETRY_ACTION,
		]);
	});

	test("waits on the customer to start the server once a key is saved", () => {
		expect(stateOf(FivemSetupPhase.Stopped)).toBe(BridgeSetupStepState.Active);
		expect(promptOf(FivemSetupPhase.Stopped)?.kind).toBe(BridgeSetupPromptKind.Wait);
	});

	test("waits without a button while the console is being watched", () => {
		expect(stateOf(FivemSetupPhase.Checking)).toBe(BridgeSetupStepState.Active);
		expect(promptOf(FivemSetupPhase.Checking)?.kind).toBe(BridgeSetupPromptKind.Wait);
	});

	test("finishes the step with no prompt at all once cfx.re accepts the key", () => {
		expect(stateOf(FivemSetupPhase.Ready)).toBe(BridgeSetupStepState.Done);
		expect(promptOf(FivemSetupPhase.Ready)).toBeNull();
	});

	test("fails the step with a retry when cfx.re refuses the key", () => {
		expect(stateOf(FivemSetupPhase.Rejected)).toBe(BridgeSetupStepState.Failed);

		const prompt = promptOf(FivemSetupPhase.Rejected);

		expect(prompt?.kind).toBe(BridgeSetupPromptKind.Failed);
		expect(prompt?.kind === BridgeSetupPromptKind.Failed && prompt.actions.map((action) => action.id)).toEqual([
			RETRY_ACTION,
		]);
	});

	test("fails the step with a retry when cfx.re never answers", () => {
		expect(stateOf(FivemSetupPhase.Silent)).toBe(BridgeSetupStepState.Failed);
		expect(promptOf(FivemSetupPhase.Silent)?.kind).toBe(BridgeSetupPromptKind.Failed);
	});

	test("writes every prompt and every button in both arabic and english", () => {
		for (const phase of Object.values(FivemSetupPhase)) {
			const prompt = runtimeOf(phase).prompt;

			if (prompt === null) {
				continue;
			}

			expect(prompt.message.ar.length).toBeGreaterThan(0);
			expect(prompt.message.en.length).toBeGreaterThan(0);

			const actions =
				prompt.kind === BridgeSetupPromptKind.Wait || prompt.kind === BridgeSetupPromptKind.Progress
					? []
					: prompt.actions;

			for (const action of actions) {
				expect(action.label.ar.length).toBeGreaterThan(0);
				expect(action.label.en.length).toBeGreaterThan(0);
			}
		}
	});
});

describe("opening the flow on the state the install leaves behind", () => {
	test("asks for the key first when the install found none", () => {
		expect(startingRuntime(false)).toEqual(runtimeOf(FivemSetupPhase.MissingKey));
	});

	test("waits for a start when the install wrote a key into server.cfg", () => {
		expect(startingRuntime(true)).toEqual(runtimeOf(FivemSetupPhase.Stopped));
	});
});

describe("reading the licence answer out of the fxserver console", () => {
	test("reads the success line the getting-started guide quotes", () => {
		expect(SERVER_READY.test(READY_LINE)).toBe(true);
		expect(outcomeOf(READY_LINE)).toBe(FivemSetupPhase.Ready);
	});

	test("reads the rejection line the getting-started guide quotes", () => {
		expect(LICENSE_REJECTED.test(REJECTED_LINE)).toBe(true);
		expect(outcomeOf(REJECTED_LINE)).toBe(FivemSetupPhase.Rejected);
	});

	test("treats an invalid or expired key as a rejection", () => {
		expect(outcomeOf("Invalid server license key")).toBe(FivemSetupPhase.Rejected);
		expect(outcomeOf("expired license key")).toBe(FivemSetupPhase.Rejected);
		expect(LICENSE_INVALID.test("Invalid licence key")).toBe(true);
	});

	test("says nothing about a line that carries no licence answer", () => {
		expect(outcomeOf("All ready! Please access")).toBeNull();
		expect(LICENSE_CHECKING.test(CHECKING_LINE)).toBe(true);
	});

	test("trusts a success still standing in the buffer, because an authenticated server never prints again", () => {
		expect(
			tailOutcome([
				REJECTED_LINE,
				READY_LINE,
			]),
		).toBe(FivemSetupPhase.Ready);
	});

	test("never answers rejected from the buffer, because the rejection may belong to the key before this one", () => {
		expect(
			tailOutcome([
				REJECTED_LINE,
			]),
		).toBeNull();

		expect(
			tailOutcome([
				READY_LINE,
				REJECTED_LINE,
			]),
		).toBeNull();
	});

	test("waits rather than answering from an older attempt when a check is still in flight", () => {
		expect(
			tailOutcome([
				REJECTED_LINE,
				CHECKING_LINE,
			]),
		).toBeNull();
	});

	test("waits when the console carries no licence line at all", () => {
		expect(
			tailOutcome([
				"All ready! Please access",
			]),
		).toBeNull();
	});
});

describe("the console lines the closed-source licensing component prints", () => {
	// Read off a running dev container on 2026-09-04 (server pjjdxh5v8j, FXServer
	// artifact in the fivem image, LICENSE_KEY set to a well-formed but fake key).
	// txAdmin respawns FXServer every few seconds, so this trio repeats verbatim.
	const CHECKING_CONSOLE_LINE = "[          svadhesive] Authenticating server license key...";

	const REJECTED_CONSOLE_LINE =
		"[          svadhesive] Error: Could not authenticate server license key. The specified key (cfxk...9xk2) does not exist.";

	test("LICENSE_CHECKING matches the line FXServer prints while it authenticates", () => {
		expect(LICENSE_CHECKING.test(CHECKING_CONSOLE_LINE)).toBe(true);
	});

	test("LICENSE_REJECTED matches the line a key that does not exist produces", () => {
		expect(LICENSE_REJECTED.test(REJECTED_CONSOLE_LINE)).toBe(true);
	});

	test("a rejected key does not also print an invalid-key line", () => {
		expect(LICENSE_INVALID.test(REJECTED_CONSOLE_LINE)).toBe(false);
	});

	// LICENSE_INVALID stays unverified: a key that does not exist is rejected with
	// the line above, and the "invalid"/"expired" wording needs a real key that has
	// been revoked or has lapsed. Until one is read off a container, the pattern is
	// a second net behind LICENSE_REJECTED rather than a transcribed line.
	test.todo("matches the exact invalid or expired licence line FXServer prints — needs a real Cfx key that has lapsed or been revoked", () => {
		expect(LICENSE_INVALID.source).toBe("(invalid|expired) (server )?licen[cs]e key");
	});
});

const LICENSE_KEY = "cfxk_1a2b3c4d5e6f7g8h9i0j1_zz9xk2";

interface VerifyHarness {
	context: Bridge.Context;
	reports: Bridge.SetupRuntime[];
	print: (line: string) => void;
}

const harness = (tail: string[], key: string = LICENSE_KEY): VerifyHarness => {
	const reports: Bridge.SetupRuntime[] = [];
	const followers: {
		pattern: RegExp;
		onMatch: (match: RegExpMatchArray) => void;
	}[] = [];

	const context = {
		variable(name: string) {
			return name === LICENSE_VARIABLE ? key : null;
		},

		logs: {
			async tail() {
				return [
					...tail,
				];
			},

			follow(pattern: RegExp, onMatch: (match: RegExpMatchArray) => void) {
				const follower = {
					pattern,
					onMatch,
				};

				followers.push(follower);

				return () => {
					followers.splice(followers.indexOf(follower), 1);
				};
			},
		},

		setup: {
			report(runtime: Bridge.SetupRuntime) {
				reports.push(runtime);
			},

			clear() {
				return;
			},
		},

		log: Object.assign(
			() => {
				return;
			},
			{
				warn: () => {
					return;
				},
			},
		),
	};

	return {
		context: context as unknown as Bridge.Context,
		reports,

		print(line: string) {
			for (const follower of [
				...followers,
			]) {
				const match = line.match(follower.pattern);

				if (match !== null) {
					follower.onMatch(match);
				}
			}
		},
	};
};

const SETTLE_MS = 20;

describe("checking a licence key against a console that keeps respawning", () => {
	test("stays on checking while the only rejection in the buffer belongs to an older key", async () => {
		const { context, reports, print } = harness([
			CHECKING_LINE,
			REJECTED_LINE,
		]);

		await checkLicence(context);
		await Bun.sleep(SETTLE_MS);

		expect(reports).toEqual([
			runtimeOf(FivemSetupPhase.Checking),
		]);

		print(REJECTED_LINE);
		await Bun.sleep(SETTLE_MS);

		expect(reports).toEqual([
			runtimeOf(FivemSetupPhase.Checking),
			runtimeOf(FivemSetupPhase.Rejected),
		]);
	});

	test("answers ready off the buffer alone, because an authenticated server prints nothing more", async () => {
		const { context, reports } = harness([
			CHECKING_LINE,
			READY_LINE,
		]);

		await checkLicence(context);
		await Bun.sleep(SETTLE_MS);

		expect(reports).toEqual([
			runtimeOf(FivemSetupPhase.Checking),
			runtimeOf(FivemSetupPhase.Ready),
		]);
	});

	test("asks for a key rather than watching the console when none is saved", async () => {
		const { context, reports } = harness([], "not-a-key");

		await checkLicence(context);

		expect(reports).toEqual([
			runtimeOf(FivemSetupPhase.MissingKey),
		]);
	});
});
