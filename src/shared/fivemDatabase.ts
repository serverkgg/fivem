export const DATABASE_HOST = "127.0.0.1";

export const DATABASE_PORT = 3306;

export const DATABASE_NAME = "fivem";

export const DATABASE_USER = "fivem";

export const connectionString = (password: string) => {
	return `mysql://${DATABASE_USER}:${password}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}?charset=utf8mb4`;
};

export const initialiseSql = (password: string) => {
	return [
		`CREATE DATABASE IF NOT EXISTS \`${DATABASE_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
		`CREATE OR REPLACE USER '${DATABASE_USER}'@'127.0.0.1' IDENTIFIED BY '${password}';`,
		`CREATE OR REPLACE USER '${DATABASE_USER}'@'localhost' IDENTIFIED BY '${password}';`,
		`GRANT ALL PRIVILEGES ON \`${DATABASE_NAME}\`.* TO '${DATABASE_USER}'@'127.0.0.1';`,
		`GRANT ALL PRIVILEGES ON \`${DATABASE_NAME}\`.* TO '${DATABASE_USER}'@'localhost';`,
		"FLUSH PRIVILEGES;",
		"",
	].join("\n");
};
