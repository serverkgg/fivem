import type { Bridge } from "@serverkgg/bridge";
import { createRosterSync } from "@serverkgg/bridge/presence";
import type { FivemRosterEntry } from "./fivemPlayers";

const presenceOf = (player: FivemRosterEntry): Bridge.Values => {
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

export const roster = createRosterSync<FivemRosterEntry>({
	id(player) {
		return player.id;
	},
	presenceOf,
});
