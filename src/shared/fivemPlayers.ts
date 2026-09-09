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
	slot: number;
	ping: number | null;
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

// A session id is reassigned the moment a player leaves, so it identifies a
// connection and never a person. The identifier does, which is why it is the
// row id and the slot is only what a command addresses.
const SLOT_IDENTIFIER_PREFIX = "slot:";

const rosterIdOf = (identifiers: string[], slot: number): string => {
	return preferredIdentifier(identifiers) ?? `${SLOT_IDENTIFIER_PREFIX}${slot}`;
};

// An anonymised payload carries one { id: 0, name: "Player" } per connected
// player, so every entry collapses onto the same slot. Counting them is the only
// safe reading: a roster keyed on slot 0 would report one player and turn every
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

		const slot = numberOrNull(entry.id);

		if (slot === null) {
			return [];
		}

		const identifiers = identifiersOf(entry.identifiers);
		const name = typeof entry.name === "string" && entry.name.length > 0 ? entry.name : `#${slot}`;

		return [
			{
				id: rosterIdOf(identifiers, slot),
				name,
				slot,
				ping: numberOrNull(entry.ping),
			},
		];
	});

	const anonymous = entries.length > 0 && entries.every((entry) => entry.slot === 0);

	return {
		entries: anonymous ? [] : entries,
		count: payload.length,
		anonymous,
	};
};
