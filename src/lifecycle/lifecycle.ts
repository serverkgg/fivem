import { type Bridge, BridgeKind, BridgeUserError } from "@serverkgg/bridge";
import { SERVER_READY } from "../events";
import { isLicenseKey, LICENSE_VARIABLE, START_SCRIPT } from "../shared";

const STOP_TIMEOUT_SECONDS = 60;

const STOP_REASON = "the panel stopped the server";

// FXServer exits within a second when the licence key is missing, which the
// supervisor would read as five crash-restarts and a tripped breaker. Refusing
// to launch turns that into one message the player can act on.
const requireLicense = (context: Bridge.Context) => {
	const licenseKey = context.variable(LICENSE_VARIABLE) ?? "";

	if (!isLicenseKey(licenseKey)) {
		throw new BridgeUserError({
			ar: "سيرفرك يبي مفتاح ترخيص من Cfx.re عشان يشتغل. سوّ مفتاح من portal.cfx.re والصقه في تبويب التجهيز.",
			en: "your server needs a Cfx.re licence key to run — create one on portal.cfx.re and paste it into the Setup tab",
		});
	}
};

export const lifecycle: Bridge.Lifecycle = {
	kind: BridgeKind.Lifecycle,
	ready: SERVER_READY,
	stopTimeoutSeconds: STOP_TIMEOUT_SECONDS,
	async command(context) {
		requireLicense(context);

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
