import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { readStamp } from "../install";
import { playerRoster } from "../shared";

const REFRESH_SECONDS = 15;

const KICK_REASON = "You were removed by an admin.";

export const players: Bridge.Collection = {
	kind: BridgeKind.Collection,
	requiresRunning: true,
	refreshSeconds: REFRESH_SECONDS,
	async list(context) {
		const stamp = await readStamp(context);

		return await playerRoster(context, stamp?.playersToken ?? null);
	},
	actions: {
		async kick(context, row) {
			await context.command(`serverk_kick ${row.id} ${KICK_REASON}`);
		},
	},
};
