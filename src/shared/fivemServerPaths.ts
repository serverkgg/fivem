import type { Bridge } from "@serverkgg/bridge";
import { PANEL_RESOURCE } from "./fivemPaths";
import { DEFAULT_SERVER_PATHS, serverPathsOf, TXADMIN_CONFIG_FILE, type TxAdminServerPaths } from "./fivemTxAdmin";

export interface FivemServerPaths extends TxAdminServerPaths {
	resources: string;
	panelResource: string;
	deployed: boolean;
}

const pathsOf = (paths: TxAdminServerPaths, deployed: boolean): FivemServerPaths => {
	const resources = `${paths.dataPath}/resources`;

	return {
		...paths,
		resources,
		panelResource: `${resources}/[${PANEL_RESOURCE}]/${PANEL_RESOURCE}`,
		deployed,
	};
};

export const DEFAULT_PATHS = pathsOf(DEFAULT_SERVER_PATHS, false);

// txAdmin's own config.json is the record of where the server lives, so a
// recipe the owner deployed from the txAdmin setup page moves every path we
// write with it instead of leaving us editing an inert server.cfg.
export const serverPaths = async (context: Bridge.Context): Promise<FivemServerPaths> => {
	if (!(await context.files.exists(TXADMIN_CONFIG_FILE))) {
		return DEFAULT_PATHS;
	}

	const declared = serverPathsOf(await context.files.read(TXADMIN_CONFIG_FILE));

	if (declared === null) {
		return DEFAULT_PATHS;
	}

	return pathsOf(declared, declared.dataPath !== DEFAULT_SERVER_PATHS.dataPath);
};
