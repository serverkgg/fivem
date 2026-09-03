import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { readSettings, writeSettings } from "../shared";

export const settings: Bridge.Settings = {
	kind: BridgeKind.Settings,
	async read(context) {
		return await readSettings(context);
	},
	async write(context, values) {
		await writeSettings(context, values);
	},
};
