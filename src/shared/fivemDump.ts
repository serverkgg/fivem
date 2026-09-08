import { type Bridge, BridgeUserError } from "@serverkgg/bridge";
import { execDetail } from "@serverkgg/bridge/utils";
import { DATABASE_NAME } from "./fivemDatabase";
import { absolutePath as absolute, DATABASE_CLIENT_FILE, DATABASE_DUMP_FILE } from "./fivemPaths";

const DUMP_TIMEOUT_MS = 300_000;

const STDERR_TAIL = 200;

const SQL_PATH = /^[\w][\w./-]{0,200}\.sql$/i;

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
			detail: execDetail(result),
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

export const sqlPathArgument = (value: string) => {
	const path = value.trim().replace(/^\/+/, "");

	if (!SQL_PATH.test(path) || path.includes("..")) {
		throw new BridgeUserError({
			ar: "اكتب مسار ملف .sql داخل سيرفرك، مثال: server-data/esx.sql",
			en: "give the path of a .sql file inside your server, for example server-data/esx.sql",
		});
	}

	return path;
};

// Frameworks ship their schema as a .sql file. The owner uploads it with the
// file manager and names it here, which is the same route txAdmin's recipes
// take when they run a framework's SQL against the deployer's database.
export const importSql = async (context: Bridge.Context, path: string) => {
	if (!(await context.files.exists(DATABASE_CLIENT_FILE))) {
		throw new BridgeUserError({
			ar: "قاعدة البيانات لسه ما جهزت. شغّل السيرفر مرة وجرّب بعدها.",
			en: "the database is not ready yet — start the server once and try again",
		});
	}

	if (!(await context.files.exists(path))) {
		throw new BridgeUserError({
			ar: "ما لقينا الملف. تأكد من المسار في مدير الملفات.",
			en: "we could not find that file — check the path in the file manager",
		});
	}

	const result = await context.exec(
		[
			"mariadb",
			`--defaults-file=${absolute(DATABASE_CLIENT_FILE)}`,
			DATABASE_NAME,
			"-e",
			`source ${absolute(path)}`,
		],
		{
			timeoutMs: DUMP_TIMEOUT_MS,
		},
	);

	if (result.code !== 0) {
		const reason = result.stderr.trim().slice(0, STDERR_TAIL);

		context.log.warn("the sql file failed against the database", {
			path,
			code: result.code,
			detail: execDetail(result),
		});

		throw new BridgeUserError({
			ar: `ما قدرنا ننفّذ الملف على قاعدة البيانات: ${reason}`,
			en: `we could not run that file against the database: ${reason}`,
		});
	}

	context.log("sql file imported into the database", {
		path,
	});
};
