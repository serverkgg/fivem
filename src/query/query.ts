import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { readStamp } from "../install";
import { type FivemRosterEntry, playerRoster, serverDynamic } from "../shared";

const REFRESH_SECONDS = 15;

const online = new Map<string, FivemRosterEntry>();

const presenceOf = (player: FivemRosterEntry) => {
	return {
		player: player.name,
		id: player.id,
		...(player.ping === null
			? {}
			: {
					ping: String(player.ping),
				}),
		...(player.identifier === null
			? {}
			: {
					identifier: player.identifier,
				}),
	};
};

// A roster the server anonymised carries no usable identity, so it is read as a
// count and nothing else. Emitting from it would report one player joining and
// leaving over and over, because every entry shares id 0.
const syncSessions = async (context: Bridge.Context) => {
	let current: Map<string, FivemRosterEntry>;

	try {
		const stamp = await readStamp(context);
		const roster = await playerRoster(context, stamp?.playersToken ?? null);

		if (roster.anonymous) {
			return;
		}

		current = new Map(
			roster.entries.map((player) => [
				player.id,
				player,
			]),
		);
	} catch {
		return;
	}

	for (const [id, player] of current) {
		if (!online.has(id)) {
			context.emit("PlayerJoined", presenceOf(player));
		}
	}

	for (const [id, player] of online) {
		if (!current.has(id)) {
			context.emit("PlayerLeft", presenceOf(player));
		}
	}

	online.clear();

	for (const [id, player] of current) {
		online.set(id, player);
	}
};

export const query: Bridge.Query = {
	kind: BridgeKind.Query,
	refreshSeconds: REFRESH_SECONDS,
	async sample(context) {
		await syncSessions(context);

		try {
			return await serverDynamic(context);
		} catch {
			return {
				online: null,
				max: null,
			};
		}
	},
};
