export const VOLUME_ROOT = "/home/container";

export const SERVER_DATA_DIRECTORY = "server-data";

export const SERVER_CONFIG_NAME = "server.cfg";

export const PANEL_RESOURCE = "serverk";

export const RUNTIME_DIRECTORY = "alpine";

export const RUN_SCRIPT = "run.sh";

export const RUN_PID_FILE = ".serverk-run.pid";

export const ARTIFACT_ARCHIVE = ".serverk-artifact.tar.xz";

export const SERVER_DATA_ARCHIVE = ".serverk-server-data.tar.gz";

export const DATABASE_DIRECTORY = ".mariadb";

export const DATABASE_INIT_FILE = `${DATABASE_DIRECTORY}/serverk-init.sql`;

export const DATABASE_CLIENT_FILE = `${DATABASE_DIRECTORY}/serverk-client.cnf`;

export const DATABASE_SOCKET = `${DATABASE_DIRECTORY}/mysql.sock`;

export const DATABASE_DUMP_FILE = ".serverk-database.sql";

export const START_SCRIPT = "/serverk/start.sh";

export const ANNOUNCE_MESSAGE_LENGTH = 200;

export const FREE_SLOT_LIMIT = 48;

export const MAX_SLOT_LIMIT = 2048;

export const absolutePath = (path: string) => {
	return `${VOLUME_ROOT}/${path}`;
};

export const volumePath = (absolute: string): string | null => {
	const prefix = `${VOLUME_ROOT}/`;

	if (!absolute.startsWith(prefix)) {
		return null;
	}

	const relative = absolute.slice(prefix.length).replaceAll(/\/+$/g, "");

	return relative.length > 0 ? relative : null;
};
