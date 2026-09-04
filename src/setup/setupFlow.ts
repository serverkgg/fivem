import { type Bridge, BridgeSetupPromptKind, BridgeSetupStepState, BridgeUserError } from "@serverkgg/bridge";
import { LICENSE_CHECKING, LICENSE_INVALID, LICENSE_REJECTED, SERVER_READY } from "../events";
import { licenseKeyOf } from "../shared";

export const VERIFY_STEP = "verify";

export const RETRY_ACTION = "retry";

export const VERIFY_TIMEOUT_MS = 120_000;

export const TAIL_LINES = 200;

const READY_LINE = new RegExp(SERVER_READY.source, "i");

const REJECTED_LINE = new RegExp(`${LICENSE_REJECTED.source}|${LICENSE_INVALID.source}`, "i");

const VERIFY_LINE = new RegExp(`${READY_LINE.source}|${REJECTED_LINE.source}`, "i");

const RETRY: Bridge.SetupAction = {
	id: RETRY_ACTION,
	label: {
		ar: "جرّب مرة ثانية",
		en: "Try again",
	},
};

const MISSING_KEY_MESSAGE: Bridge.Text = {
	ar: "الصق مفتاح الترخيص أول من الخطوة اللي قبل، وبعدها نتأكد منه.",
	en: "Paste your licence key in the previous step first, then we check it.",
};

const STOPPED_MESSAGE: Bridge.Text = {
	ar: "شغّل سيرفرك عشان نتأكد من الترخيص.",
	en: "Start your server so we can check the licence.",
};

const CHECKING_MESSAGE: Bridge.Text = {
	ar: "نتأكد من ترخيصك…",
	en: "Checking your licence…",
};

const REJECTED_MESSAGE: Bridge.Text = {
	ar: "Cfx.re رفض المفتاح. ارجع لخطوة الترخيص، الصق مفتاح صحيح، وجرّب مرة ثانية.",
	en: "Cfx.re refused the key. Go back to the licence step, paste a valid key, and try again.",
};

const SILENT_MESSAGE: Bridge.Text = {
	ar: "ما جانا رد من Cfx.re. جرّب مرة ثانية، وإذا تكرر افتح الكونسول وشوف وش يقول.",
	en: "No answer came from Cfx.re. Try again, and if it keeps happening open the console and see what it says.",
};

const UNKNOWN_STEP: Bridge.Text = {
	ar: "الخطوة هذي ما هي من خطوات تجهيز فايف إم.",
	en: "That step is not part of the FiveM setup.",
};

const UNKNOWN_ACTION: Bridge.Text = {
	ar: "ما نعرف الزر هذا. حدّث الصفحة وجرّب مرة ثانية.",
	en: "We do not know that button. Refresh the page and try again.",
};

export enum FivemSetupPhase {
	MissingKey = "missing-key",
	Stopped = "stopped",
	Checking = "checking",
	Ready = "ready",
	Rejected = "rejected",
	Silent = "silent",
}

const stepsOf = (verify: BridgeSetupStepState): Bridge.SetupStepStatus[] => {
	return [
		{
			id: VERIFY_STEP,
			state: verify,
		},
	];
};

export const runtimeOf = (phase: FivemSetupPhase): Bridge.SetupRuntime => {
	switch (phase) {
		case FivemSetupPhase.MissingKey: {
			return {
				steps: stepsOf(BridgeSetupStepState.Pending),
				prompt: {
					kind: BridgeSetupPromptKind.Action,
					message: MISSING_KEY_MESSAGE,
					actions: [
						RETRY,
					],
				},
			};
		}

		case FivemSetupPhase.Stopped: {
			return {
				steps: stepsOf(BridgeSetupStepState.Active),
				prompt: {
					kind: BridgeSetupPromptKind.Wait,
					message: STOPPED_MESSAGE,
				},
			};
		}

		case FivemSetupPhase.Checking: {
			return {
				steps: stepsOf(BridgeSetupStepState.Active),
				prompt: {
					kind: BridgeSetupPromptKind.Wait,
					message: CHECKING_MESSAGE,
				},
			};
		}

		case FivemSetupPhase.Ready: {
			return {
				steps: stepsOf(BridgeSetupStepState.Done),
				prompt: null,
			};
		}

		case FivemSetupPhase.Rejected: {
			return {
				steps: stepsOf(BridgeSetupStepState.Failed),
				prompt: {
					kind: BridgeSetupPromptKind.Failed,
					message: REJECTED_MESSAGE,
					actions: [
						RETRY,
					],
				},
			};
		}

		case FivemSetupPhase.Silent: {
			return {
				steps: stepsOf(BridgeSetupStepState.Failed),
				prompt: {
					kind: BridgeSetupPromptKind.Failed,
					message: SILENT_MESSAGE,
					actions: [
						RETRY,
					],
				},
			};
		}
	}
};

export const startingRuntime = (licensed: boolean): Bridge.SetupRuntime => {
	return runtimeOf(licensed ? FivemSetupPhase.Stopped : FivemSetupPhase.MissingKey);
};

export const outcomeOf = (line: string) => {
	if (READY_LINE.test(line)) {
		return FivemSetupPhase.Ready;
	}

	return REJECTED_LINE.test(line) ? FivemSetupPhase.Rejected : null;
};

// The buffer can only prove success. An authenticated server stays up and never
// prints the line again, so a SERVER_READY still standing in the tail is still
// true. A rejection is the opposite: txAdmin respawns FXServer within seconds of
// one, so the rejection in the buffer may belong to the key before this one and
// the verdict for this one is about to arrive on the follow.
export const tailOutcome = (lines: string[]) => {
	for (const line of lines.toReversed()) {
		const outcome = outcomeOf(line);

		if (outcome !== null) {
			return outcome === FivemSetupPhase.Ready ? FivemSetupPhase.Ready : null;
		}

		if (LICENSE_CHECKING.test(line)) {
			return null;
		}
	}

	return null;
};

interface SetupRun {
	stopped: boolean;
	stops: (() => void)[];
	first: Promise<void>;
	settle: (() => void) | null;
}

let running: SetupRun | null = null;

const stopRun = (run: SetupRun) => {
	run.stopped = true;

	run.settle?.();
	run.settle = null;

	for (const stop of run.stops.splice(0)) {
		stop();
	}
};

const startRun = (): SetupRun => {
	if (running !== null) {
		stopRun(running);
	}

	let settle: (() => void) | null = null;

	const first = new Promise<void>((resolve) => {
		settle = () => {
			resolve();
		};
	});

	running = {
		stopped: false,
		stops: [],
		first,
		settle,
	};

	return running;
};

const report = (context: Bridge.Context, run: SetupRun, phase: FivemSetupPhase) => {
	if (run.stopped) {
		return;
	}

	context.setup.report(runtimeOf(phase));

	run.settle?.();
	run.settle = null;
};

const reportOnce = (context: Bridge.Context, phase: FivemSetupPhase) => {
	const run = startRun();

	report(context, run, phase);

	stopRun(run);
};

const awaitLine = (context: Bridge.Context, run: SetupRun, pattern: RegExp, timeoutMs: number) => {
	return new Promise<RegExpMatchArray | null>((resolve) => {
		let unfollow: (() => void) | null = null;
		let timer: ReturnType<typeof setTimeout> | null = null;
		let settled = false;

		const settle = (match: RegExpMatchArray | null) => {
			if (settled) {
				return;
			}

			settled = true;

			if (timer !== null) {
				clearTimeout(timer);
			}

			unfollow?.();
			resolve(match);
		};

		timer = setTimeout(() => {
			settle(null);
		}, timeoutMs);

		unfollow = context.logs.follow(pattern, settle);

		run.stops.push(() => {
			settle(null);
		});
	});
};

const verify = async (context: Bridge.Context, run: SetupRun) => {
	report(context, run, FivemSetupPhase.Checking);

	// txAdmin respawns FXServer every few seconds, so the answer to the key we
	// are checking may already have scrolled past. The follow starts before the
	// tail is read so no line printed between the two is lost.
	const followed = awaitLine(context, run, VERIFY_LINE, VERIFY_TIMEOUT_MS);
	const printed = tailOutcome(await context.logs.tail(TAIL_LINES));

	if (run.stopped) {
		return;
	}

	if (printed !== null) {
		report(context, run, printed);

		return;
	}

	const line = await followed;

	if (run.stopped) {
		return;
	}

	report(
		context,
		run,
		line === null ? FivemSetupPhase.Silent : (outcomeOf(line.at(0) ?? "") ?? FivemSetupPhase.Silent),
	);
};

const drive = async (context: Bridge.Context, run: SetupRun) => {
	try {
		await verify(context, run);
	} catch (error) {
		context.log.warn("the fivem licence check could not be carried on", {
			error: error instanceof Error ? error.message : String(error),
		});

		report(context, run, FivemSetupPhase.Silent);
	} finally {
		stopRun(run);
	}
};

export const checkLicence = async (context: Bridge.Context) => {
	if (licenseKeyOf(context) === null) {
		reportOnce(context, FivemSetupPhase.MissingKey);

		return;
	}

	const run = startRun();

	void drive(context, run);

	await run.first;
};

export const reportStopped = (context: Bridge.Context) => {
	reportOnce(context, licenseKeyOf(context) === null ? FivemSetupPhase.MissingKey : FivemSetupPhase.Stopped);
};

export const unknownSetupStep = () => {
	return new BridgeUserError(UNKNOWN_STEP);
};

export const unknownSetupAction = () => {
	return new BridgeUserError(UNKNOWN_ACTION);
};
