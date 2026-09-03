import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { SERVER_READY } from "../events";
import { START_SCRIPT } from "../shared";

const STOP_TIMEOUT_SECONDS = 60;

const STOP_REASON = "the panel stopped the server";

export const lifecycle: Bridge.Lifecycle = {
	kind: BridgeKind.Lifecycle,
	ready: SERVER_READY,
	stopTimeoutSeconds: STOP_TIMEOUT_SECONDS,
	async command(context) {
		return [
			START_SCRIPT,
			String(context.port("game")),
		];
	},
	async stop(context) {
		context.emit("ServerStopping");

		await context.command(`quit "${STOP_REASON}"`);
	},
};
