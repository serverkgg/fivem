import type { Bridge } from "@serverkgg/bridge";

export const STAMP_FILE = ".serverk-install.json";

export interface InstallStamp {
	build: string;
	reference: string;
	databasePassword: string;
	playersToken: string;
}

const isText = (value: unknown): value is string => {
	return typeof value === "string" && value.length > 0;
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
			databasePassword: isText(parsed.databasePassword) ? parsed.databasePassword : "",
			playersToken: isText(parsed.playersToken) ? parsed.playersToken : "",
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
