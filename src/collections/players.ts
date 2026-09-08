import { type Bridge, BridgeKind, BridgeUserError } from "@serverkgg/bridge";
import { installStamp } from "../install";
import { playerRoster } from "../shared";

const REFRESH_SECONDS = 15;

const KICK_REASON = "You were removed by an admin.";

export const players: Bridge.Collection = {
	kind: BridgeKind.Collection,
	requiresRunning: true,
	refreshSeconds: REFRESH_SECONDS,
	async list(context) {
		const stamp = await installStamp(context);
		const roster = await playerRoster(context, stamp?.playersToken ?? null);

		// Without a matching sv_playersToken FXServer answers one anonymous entry
		// per player, which is a count and never a roster.
		if (roster.anonymous) {
			throw new BridgeUserError({
				ar: "السيرفر يرد بأسماء مخفية. تأكد إن سطر set sv_playersToken موجود في server.cfg وأعد تشغيل السيرفر.",
				en: "the server is answering with hidden names — check the set sv_playersToken line is in server.cfg and restart",
			});
		}

		return roster.entries;
	},
	actions: {
		async kick(context, row) {
			await context.command(`serverk_kick ${row.id} ${KICK_REASON}`);

			context.emit("PlayerKicked", {
				player: typeof row.name === "string" && row.name.length > 0 ? row.name : row.id,
				id: row.id,
			});
		},
	},
};
