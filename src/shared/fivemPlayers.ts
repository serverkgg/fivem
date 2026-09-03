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

export const rosterOf = (payload: unknown): FivemRosterEntry[] => {
	if (!Array.isArray(payload)) {
		return [];
	}

	return payload.flatMap((entry: FivemPlayerPayload) => {
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
};
