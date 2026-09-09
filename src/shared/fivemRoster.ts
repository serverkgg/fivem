import type { Bridge } from "@serverkgg/bridge";
import { createRosterSync } from "@serverkgg/bridge/presence";
import type { FivemRosterEntry } from "./fivemPlayers";

export const presenceOf = (player: FivemRosterEntry): Bridge.Values => {
	return {
		player: player.name,
		identifier: player.id,
		slot: String(player.slot),
		...(player.ping === null
			? {}
			: {
					ping: String(player.ping),
				}),
	};
};

export const roster = createRosterSync<FivemRosterEntry>({
	id(player) {
		return player.id;
	},
	presenceOf,
});
