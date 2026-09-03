import type { Bridge } from "@serverkgg/bridge";
import { rosterOf } from "./fivemPlayers";

const HOST = "127.0.0.1";

const REQUEST_TIMEOUT_MS = 5000;

export const PLAYERS_PATH = "/players.json";

export const INFO_PATH = "/info.json";

export const PLAYERS_TOKEN_HEADER = "X-Players-Token";

export interface FivemInfo {
	enhancedHostSupport?: boolean;
	icon?: string;
	resources?: string[];
	server?: string;
	vars?: Record<string, string>;
	version?: number;
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

// Since build 35245 an unauthenticated /players.json answers one anonymized
// entry per connected player. The real names, ids and pings only come back
// when sv_playersToken is echoed in the X-Players-Token header.
export const playerRoster = async (context: Bridge.Context, playersToken: string | null) => {
	const headers: Record<string, string> = {};

	if (playersToken !== null && playersToken.length > 0) {
		headers[PLAYERS_TOKEN_HEADER] = playersToken;
	}

	return rosterOf(await request(context, PLAYERS_PATH, headers));
};

export const playerCount = async (context: Bridge.Context) => {
	const payload = await request(context, PLAYERS_PATH);

	return Array.isArray(payload) ? payload.length : null;
};

export const serverInfo = async (context: Bridge.Context) => {
	return (await request(context, INFO_PATH)) as FivemInfo;
};

export const maxClientsOf = (info: FivemInfo): number | null => {
	const declared = info.vars?.sv_maxClients ?? info.vars?.sv_maxclients;
	const parsed = Number(declared);

	return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};
