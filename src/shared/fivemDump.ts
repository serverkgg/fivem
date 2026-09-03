import { type Bridge, BridgeUserError } from "@serverkgg/bridge";
import { DATABASE_NAME } from "./fivemDatabase";
import { DATABASE_CLIENT_FILE, DATABASE_DUMP_FILE, VOLUME_ROOT } from "./fivemPaths";

const DUMP_TIMEOUT_MS = 300_000;

const absolute = (path: string) => {
	return `${VOLUME_ROOT}/${path}`;
};

export const clientOptionFile = (password: string, socket: string, user: string) => {
	return [
		"[client]",
		`socket=${socket}`,
		`user=${user}`,
		`password=${password}`,
		"",
	].join("\n");
};

export const dumpDatabase = async (context: Bridge.Context) => {
	if (!(await context.files.exists(DATABASE_CLIENT_FILE))) {
		context.log.warn("no database credentials yet, skipping the database dump");

		return;
	}

	const result = await context.exec(
		[
			"mariadb-dump",
			`--defaults-file=${absolute(DATABASE_CLIENT_FILE)}`,
			"--single-transaction",
			"--quick",
			"--routines",
			"--events",
			"--databases",
			DATABASE_NAME,
			`--result-file=${absolute(DATABASE_DUMP_FILE)}`,
		],
		{
			timeoutMs: DUMP_TIMEOUT_MS,
		},
	);

	if (result.code !== 0) {
		context.log.warn("the database dump failed, the backup carries the previous one", {
			code: result.code,
			detail: result.stderr.slice(0, 300),
		});

		return;
	}

	context.log("database dumped for the backup", {
		sizeBytes: await context.files.size(DATABASE_DUMP_FILE),
	});
};

export const restoreDatabase = async (context: Bridge.Context) => {
	if (!(await context.files.exists(DATABASE_DUMP_FILE))) {
		throw new BridgeUserError({
			ar: "ما فيه نسخة من قاعدة البيانات. استرجع نسخة احتياطية أول.",
			en: "there is no database dump yet — restore a backup first",
		});
	}

	const result = await context.exec(
		[
			"mariadb",
			`--defaults-file=${absolute(DATABASE_CLIENT_FILE)}`,
			"-e",
			`source ${absolute(DATABASE_DUMP_FILE)}`,
		],
		{
			timeoutMs: DUMP_TIMEOUT_MS,
		},
	);

	if (result.code !== 0) {
		throw new BridgeUserError({
			ar: "ما قدرنا نرجّع قاعدة البيانات. شوف الكونسول وجرّب مرة ثانية.",
			en: "we could not restore the database — check the console and try again",
		});
	}

	context.log("database restored from the dump");
};
