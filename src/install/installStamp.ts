import type { Bridge } from "@serverkgg/bridge";
import { readStamp } from "@serverkgg/bridge/install";

export interface InstallStamp {
	build: string;
	reference: string;
	databasePassword: string;
	playersToken: string;
	controlToken: string;
	panelPassword: string;
	rconPassword: string;
	rconPasswordNext: string;
	profileSeeded: boolean;
}

export type InstallSecret = "databasePassword" | "playersToken" | "controlToken" | "panelPassword";

const isText = (value: unknown): value is string => {
	return typeof value === "string" && value.length > 0;
};

const textOr = (value: unknown, fallback: string) => {
	return isText(value) ? value : fallback;
};

export const stampOf = (raw: Record<string, unknown> | null): InstallStamp | null => {
	if (raw === null || !isText(raw.build) || !isText(raw.reference)) {
		return null;
	}

	return {
		build: raw.build,
		reference: raw.reference,
		databasePassword: textOr(raw.databasePassword, ""),
		playersToken: textOr(raw.playersToken, ""),
		controlToken: textOr(raw.controlToken, ""),
		panelPassword: textOr(raw.panelPassword, ""),
		rconPassword: textOr(raw.rconPassword, ""),
		rconPasswordNext: textOr(raw.rconPasswordNext, ""),
		profileSeeded: raw.profileSeeded === true,
	};
};

export const installStamp = async (context: Bridge.Context): Promise<InstallStamp | null> => {
	return stampOf(await readStamp(context));
};
