import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { installStamp } from "../install";
import { playerRoster, roster, serverDynamic } from "../shared";

const REFRESH_SECONDS = 15;

const readRoster = async (context: Bridge.Context) => {
	try {
		const stamp = await installStamp(context);

		return await playerRoster(context, stamp?.playersToken ?? null);
	} catch {
		return null;
	}
};

// A roster the server anonymised carries no usable identity, so it is read as a
// count and nothing else. Emitting from it would report one player joining and
// leaving over and over, because every entry shares id 0.
const syncSessions = async (context: Bridge.Context) => {
	const current = await readRoster(context);

	if (current === null || current.anonymous) {
		return;
	}

	roster.sync(context, current.entries);
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
