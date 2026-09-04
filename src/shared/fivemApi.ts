import type { Bridge } from "@serverkgg/bridge";
import { rosterOf } from "./fivemPlayers";

const HOST = "127.0.0.1";

const REQUEST_TIMEOUT_MS = 5000;

export const PLAYERS_PATH = "/players.json";

export const DYNAMIC_PATH = "/dynamic.json";

export const PLAYERS_TOKEN_HEADER = "X-Players-Token";

export interface FivemDynamic {
	clients?: unknown;
	sv_maxclients?: unknown;
	hostname?: unknown;
	gametype?: unknown;
	mapname?: unknown;
}

export class FivemApiError extends Error {
	readonly status: number | null;

	constructor(status: number | null, message: string) {
		super(message);

		this.name = "FivemApiError";
		this.status = status;
	}
}

const request = async (context: Bridge.Context, path: string, headers: Record<string, string> = {}) => {
	const response = await fetch(`http://${HOST}:${context.port("game")}${path}`, {
		headers: {
			accept: "application/json",
			...headers,
		},
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	});

	if (!response.ok) {
		throw new FivemApiError(response.status, `fxserver answered ${response.status} for ${path}`);
	}

	return (await response.json()) as unknown;
};

// citizenfx/fivem commit d52296e (2026-07-08) anonymises /players.json: without
// a token every entry comes back as id 0 with an empty identifier list, and the
// real names, ids and pings only return when sv_playersToken is echoed in the
// X-Players-Token header.
export const playerRoster = async (context: Bridge.Context, playersToken: string | null) => {
	const headers: Record<string, string> = {};

	if (playersToken !== null && playersToken.length > 0) {
		headers[PLAYERS_TOKEN_HEADER] = playersToken;
	}

	return rosterOf(await request(context, PLAYERS_PATH, headers));
};

const countOf = (value: unknown): number | null => {
	const parsed = Number(value);

	return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : null;
};

// /dynamic.json answers the online count and the slot limit in one call, which
// is everything the sample needs; the roster is the only reason to ask
// /players.json for more.
export const serverDynamic = async (context: Bridge.Context) => {
	const payload = (await request(context, DYNAMIC_PATH)) as FivemDynamic;

	return {
		online: countOf(payload.clients),
		max: countOf(payload.sv_maxclients),
	};
};
