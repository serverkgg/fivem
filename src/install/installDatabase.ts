import type { Bridge } from "@serverkgg/bridge";
import { execDetail } from "@serverkgg/bridge/utils";
import {
	clientOptionFile,
	DATABASE_CLIENT_FILE,
	DATABASE_DIRECTORY,
	DATABASE_INIT_FILE,
	DATABASE_SOCKET,
	DATABASE_USER,
	initialiseSql,
	VOLUME_ROOT,
} from "../shared";

const SYSTEM_TABLES = `${DATABASE_DIRECTORY}/mysql`;

const DATABASE_ROOT = `${VOLUME_ROOT}/${DATABASE_DIRECTORY}`;

export const isDatabaseInstalled = async (context: Bridge.Context) => {
	return await context.files.exists(SYSTEM_TABLES);
};

export const installDatabase = async (context: Bridge.Context) => {
	if (await isDatabaseInstalled(context)) {
		return;
	}

	context.log("preparing the mariadb data directory");

	await context.files.ensure(DATABASE_DIRECTORY, `${DATABASE_DIRECTORY}/tmp`);

	const result = await context.exec([
		"mariadb-install-db",
		"--no-defaults",
		"--user=container",
		"--basedir=/usr",
		`--datadir=${DATABASE_ROOT}`,
		"--skip-test-db",
		"--auth-root-authentication-method=socket",
	]);

	if (result.code !== 0 || !(await isDatabaseInstalled(context))) {
		throw new Error(`mariadb-install-db failed with code ${result.code} — ${execDetail(result)}`);
	}

	context.log("mariadb data directory ready");
};

// mariadbd runs the init file on every start, so the database, the user and its
// password are reconciled at boot rather than needing a running server here.
export const writeDatabaseCredentials = async (context: Bridge.Context, password: string) => {
	await context.files.ensure(DATABASE_DIRECTORY);
	await context.files.write(DATABASE_INIT_FILE, initialiseSql(password));
	await context.files.write(
		DATABASE_CLIENT_FILE,
		clientOptionFile(password, `${VOLUME_ROOT}/${DATABASE_SOCKET}`, DATABASE_USER),
	);
};
