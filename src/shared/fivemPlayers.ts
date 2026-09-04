import type { Bridge } from "@serverkgg/bridge";

export const IDENTIFIER_PRIORITY = [
	"license",
	"steam",
	"discord",
	"fivem",
	"xbl",
	"live",
	"ip",
];

export interface FivemPlayerPayload {
	endpoint?: unknown;
	id?: unknown;
	identifiers?: unknown;
	name?: unknown;
	ping?: unknown;
}

export type FivemRosterEntry = Bridge.Row & {
	name: string;
	ping: number | null;
	identifier: string | null;
};

export interface FivemRoster {
	entries: FivemRosterEntry[];
	count: number;
	anonymous: boolean;
}

const identifiersOf = (value: unknown): string[] => {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
};

export const preferredIdentifier = (identifiers: string[]): string | null => {
	for (const prefix of IDENTIFIER_PRIORITY) {
		const found = identifiers.find((identifier) => identifier.startsWith(`${prefix}:`));

		if (found !== undefined) {
			return found;
		}
	}

	return identifiers.at(0) ?? null;
};

const numberOrNull = (value: unknown): number | null => {
	const parsed = Number(value);

	return typeof value === "number" || typeof value === "string" ? (Number.isFinite(parsed) ? parsed : null) : null;
};

// An anonymised payload carries one { id: 0, name: "Player" } per connected
// player, so every entry collapses onto the same key. Counting them is the only
// safe reading: a roster keyed on id 0 would report one player and turn every
// join and leave into noise.
export const rosterOf = (payload: unknown): FivemRoster => {
	if (!Array.isArray(payload)) {
		return {
			entries: [],
			count: 0,
			anonymous: false,
		};
	}

	const entries = payload.flatMap((entry: FivemPlayerPayload) => {
		if (entry === null || typeof entry !== "object") {
			return [];
		}

		const id = numberOrNull(entry.id);

		if (id === null) {
			return [];
		}

		const identifiers = identifiersOf(entry.identifiers);
		const name = typeof entry.name === "string" && entry.name.length > 0 ? entry.name : `#${id}`;

		return [
			{
				id: String(id),
				name,
				ping: numberOrNull(entry.ping),
				identifier: preferredIdentifier(identifiers),
			},
		];
	});

	const anonymous = entries.length > 0 && entries.every((entry) => entry.id === "0");

	return {
		entries: anonymous ? [] : entries,
		count: payload.length,
		anonymous,
	};
};
