import { type Bridge, BridgeKind, BridgeUserError } from "@serverkgg/bridge";
import { installStamp } from "../install";
import { playerRoster, presenceOf } from "../shared";

const REFRESH_SECONDS = 15;

const KICK_REASON = "You were removed by an admin.";

// serverk_kick addresses the FXServer session id, and the row carries it beside
// the identifier the platform keys the player on. Anything but a whole positive
// number would reach the console as a second argument.
const slotOf = (row: Bridge.Row): number => {
	const slot = Number(row.slot);

	if (!Number.isInteger(slot) || slot <= 0) {
		throw new BridgeUserError({
			ar: "ما قدرنا نعرف خانة اللاعب. حدّث القائمة وجرّب مرة ثانية.",
			en: "the player's session slot is missing from the row — refresh the roster and try again",
		});
	}

	return slot;
};

const nameOf = (row: Bridge.Row): string => {
	return typeof row.name === "string" && row.name.length > 0 ? row.name : row.id;
};

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
			const slot = slotOf(row);

			await context.command(`serverk_kick ${slot} ${KICK_REASON}`);

			context.emit(
				"PlayerKicked",
				presenceOf({
					id: row.id,
					name: nameOf(row),
					slot,
					ping: null,
				}),
			);
		},
	},
};
