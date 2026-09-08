import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { PANEL_READY, SERVER_READY } from "../events";
import { checkLicence, reportStopped } from "../setup";
import { RUN_PID_FILE, roster, START_SCRIPT } from "../shared";

const STOP_TIMEOUT_SECONDS = 90;

// The container runs txAdmin, so the service is up once txAdmin is listening.
// A server whose owner has not pasted a licence key yet still reaches this
// line, which is what keeps its panel reachable so they can paste one.
const READY = new RegExp(`${PANEL_READY.source}|${SERVER_READY.source}`);

const PID = /^\d{1,10}$/;

// txAdmin is the process the container runs, and it answers SIGTERM by sending
// `quit` to FXServer and waiting for it to exit (core/txManager.ts). A `quit`
// typed at the game instead would only make txAdmin respawn it, so the stop
// signal has to reach the script that owns the tree.
const terminate = async (context: Bridge.Context) => {
	if (!(await context.files.exists(RUN_PID_FILE))) {
		return false;
	}

	const pid = (await context.files.read(RUN_PID_FILE)).trim();

	if (!PID.test(pid)) {
		return false;
	}

	const result = await context.exec([
		"kill",
		"-TERM",
		pid,
	]);

	return result.code === 0;
};

export const lifecycle: Bridge.Lifecycle = {
	kind: BridgeKind.Lifecycle,
	ready: READY,
	stopTimeoutSeconds: STOP_TIMEOUT_SECONDS,
	async command() {
		return [
			START_SCRIPT,
		];
	},
	async stop(context) {
		context.emit("ServerStopping");

		roster.clear();

		if (!(await terminate(context))) {
			context.log.warn("no start script pid to signal, falling back to the supervisor");
		}

		reportStopped(context);
	},
	async onReady(context) {
		roster.clear();

		await checkLicence(context);
	},
};
