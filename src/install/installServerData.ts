import type { Bridge } from "@serverkgg/bridge";
import {
	DEFAULT_PATHS,
	type FivemServerPaths,
	SERVER_DATA_ARCHIVE,
	SERVER_DATA_DIRECTORY,
	serverConfigTemplate,
} from "../shared";

const SERVER_DATA_TARBALL = "https://codeload.github.com/citizenfx/cfx-server-data/tar.gz/refs/heads/master";

export const seedServerData = async (context: Bridge.Context) => {
	if (await context.files.exists(DEFAULT_PATHS.resources)) {
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

	if (!(await context.files.exists(DEFAULT_PATHS.resources))) {
		throw new Error(`cfx-server-data unpacked but ${DEFAULT_PATHS.resources} is missing`);
	}

	context.log("vanilla fivem resources installed");
};

export const seedServerConfig = async (context: Bridge.Context, paths: FivemServerPaths) => {
	if (await context.files.exists(paths.cfgPath)) {
		return;
	}

	context.log("writing the first server.cfg", {
		path: paths.cfgPath,
	});

	await context.files.ensure(paths.dataPath);
	await context.files.write(paths.cfgPath, serverConfigTemplate(context.port("game"), `سيرفر ${context.server.code}`));
};
