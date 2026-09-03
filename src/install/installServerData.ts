import type { Bridge } from "@serverkgg/bridge";
import {
	RESOURCES_DIRECTORY,
	SERVER_CONFIG_FILE,
	SERVER_DATA_ARCHIVE,
	SERVER_DATA_DIRECTORY,
	serverConfigTemplate,
} from "../shared";

const SERVER_DATA_TARBALL = "https://codeload.github.com/citizenfx/cfx-server-data/tar.gz/refs/heads/master";

export const seedServerData = async (context: Bridge.Context) => {
	if (await context.files.exists(RESOURCES_DIRECTORY)) {
		return;
	}

	context.log("downloading the vanilla fivem resources");

	await context.files.ensure(SERVER_DATA_DIRECTORY);
	await context.files.download(SERVER_DATA_ARCHIVE, SERVER_DATA_TARBALL);

	const result = await context.exec([
		"tar",
		"-xzf",
		SERVER_DATA_ARCHIVE,
		"-C",
		SERVER_DATA_DIRECTORY,
		"--strip-components=1",
	]);

	await context.files.remove(SERVER_DATA_ARCHIVE);

	if (result.code !== 0) {
		throw new Error(`unpacking cfx-server-data failed with code ${result.code}: ${result.stderr.slice(0, 400)}`);
	}

	if (!(await context.files.exists(RESOURCES_DIRECTORY))) {
		throw new Error(`cfx-server-data unpacked but ${RESOURCES_DIRECTORY} is missing`);
	}

	context.log("vanilla fivem resources installed");
};

export const seedServerConfig = async (context: Bridge.Context) => {
	if (await context.files.exists(SERVER_CONFIG_FILE)) {
		return;
	}

	context.log("writing the first server.cfg");

	await context.files.ensure(SERVER_DATA_DIRECTORY);
	await context.files.write(
		SERVER_CONFIG_FILE,
		serverConfigTemplate(context.port("game"), `سيرفر ${context.server.code}`),
	);
};
