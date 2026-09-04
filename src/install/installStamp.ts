import type { Bridge } from "@serverkgg/bridge";

export const STAMP_FILE = ".serverk-install.json";

export interface InstallStamp {
	build: string;
	reference: string;
	databasePassword: string;
	playersToken: string;
	controlToken: string;
	panelPassword: string;
	profileSeeded: boolean;
}

export type InstallSecret = "databasePassword" | "playersToken" | "controlToken" | "panelPassword";

const isText = (value: unknown): value is string => {
	return typeof value === "string" && value.length > 0;
};

const textOr = (value: unknown, fallback: string) => {
	return isText(value) ? value : fallback;
};

export const parseStamp = (raw: string): InstallStamp | null => {
	try {
		const parsed = JSON.parse(raw) as Partial<InstallStamp>;

		if (!isText(parsed.build) || !isText(parsed.reference)) {
			return null;
		}

		return {
			build: parsed.build,
			reference: parsed.reference,
			databasePassword: textOr(parsed.databasePassword, ""),
			playersToken: textOr(parsed.playersToken, ""),
			controlToken: textOr(parsed.controlToken, ""),
			panelPassword: textOr(parsed.panelPassword, ""),
			profileSeeded: parsed.profileSeeded === true,
		};
	} catch {
		return null;
	}
};

export const readStamp = async (context: Bridge.Context): Promise<InstallStamp | null> => {
	if (!(await context.files.exists(STAMP_FILE))) {
		return null;
	}

	return parseStamp(await context.files.read(STAMP_FILE));
};

export const writeStamp = async (context: Bridge.Context, stamp: InstallStamp) => {
	await context.files.write(STAMP_FILE, `${JSON.stringify(stamp, null, 2)}\n`);
};
