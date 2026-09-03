import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { readStamp } from "../install";
import { type FivemRosterEntry, maxClientsOf, playerCount, playerRoster, serverInfo } from "../shared";

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

const syncSessions = async (context: Bridge.Context) => {
	let current: Map<string, FivemRosterEntry>;

	try {
		const stamp = await readStamp(context);

		current = new Map(
			(await playerRoster(context, stamp?.playersToken ?? null)).map((player) => [
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
			return {
				online: await playerCount(context),
				max: maxClientsOf(await serverInfo(context)),
			};
		} catch {
			return {
				online: null,
				max: null,
			};
		}
	},
};
