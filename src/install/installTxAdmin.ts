import type { Bridge } from "@serverkgg/bridge";
import {
	accountOf,
	DATABASE_HOST,
	DATABASE_NAME,
	DATABASE_PORT,
	DATABASE_USER,
	emptyConfigFile,
	environmentFile,
	FREE_SLOT_LIMIT,
	hashPassword,
	MAX_SLOT_LIMIT,
	readSettings,
	serverPathsOf,
	TXADMIN_CONFIG_FILE,
	TXADMIN_DATA_DIRECTORY,
	TXADMIN_ENVIRONMENT_FILE,
	TXADMIN_PORT,
	TXADMIN_PROFILE_DIRECTORY,
	TXADMIN_USERNAME,
	txAdminConfigFile,
} from "../shared";

export interface TxAdminInstall {
	licenseKey: string | null;
	controlToken: string;
	databasePassword: string;
	panelPassword: string;
}

// txAdmin only auto-starts FXServer once its profile names a server data path
// (FxRunner.isConfigured) and admins.json exists (AdminStore.hasAdmins), so
// serverk writes the first of those and TXHOST_DEFAULT_ACCOUNT writes the
// second. Both are txAdmin's own files in its own format — the setup page
// writes exactly this — so the owner keeps every control it offers afterwards.
export const seedTxAdminProfile = async (
	context: Bridge.Context,
	licenseKey: string | null,
	seeded: boolean,
): Promise<boolean> => {
	// core/index.ts only runs setupProfile() when the profile folder is absent,
	// so creating it without a config.json makes txAdmin fatal-error on boot
	// (ConfigStore 10). Only txData is ours to create ahead of time.
	await context.files.ensure(TXADMIN_DATA_DIRECTORY);

	const configured = (await context.files.exists(TXADMIN_CONFIG_FILE))
		? serverPathsOf(await context.files.read(TXADMIN_CONFIG_FILE)) !== null
		: false;

	// Once serverk has written the profile the owner owns it, including the
	// cleared data path the "open the setup page" action leaves behind.
	if (configured || seeded) {
		return seeded;
	}

	if (licenseKey === null) {
		context.log.warn("no cfx.re licence key yet — txadmin will run without a server until one is pasted");

		if ((await context.files.exists(TXADMIN_PROFILE_DIRECTORY)) && !(await context.files.exists(TXADMIN_CONFIG_FILE))) {
			await context.files.write(TXADMIN_CONFIG_FILE, emptyConfigFile());
		}

		return false;
	}

	context.log("writing the first txadmin profile");

	await context.files.ensure(TXADMIN_PROFILE_DIRECTORY);
	await context.files.write(TXADMIN_CONFIG_FILE, txAdminConfigFile(`سيرفر ${context.server.code}`));

	return true;
};

// TXHOST_MAX_SLOTS is a ceiling txAdmin enforces on sv_maxClients. The free
// Cfx.re tier is 48, and an owner who raised the setting because their own
// Element Club subscription allows it keeps the number they chose.
const slotCeiling = async (context: Bridge.Context) => {
	const settings = await readSettings(context);
	const declared = Number(settings.sv_maxclients ?? FREE_SLOT_LIMIT);
	const wanted = Number.isFinite(declared) ? Math.trunc(declared) : FREE_SLOT_LIMIT;

	return Math.min(MAX_SLOT_LIMIT, Math.max(FREE_SLOT_LIMIT, wanted));
};

export const writeTxAdminEnvironment = async (context: Bridge.Context, install: TxAdminInstall) => {
	const passwordHash = await hashPassword(install.panelPassword);

	await context.files.write(
		TXADMIN_ENVIRONMENT_FILE,
		environmentFile({
			dataPath: TXADMIN_DATA_DIRECTORY,
			txAdminPort: context.port(TXADMIN_PORT),
			gamePort: context.port("game"),
			maxSlots: await slotCeiling(context),
			licenseKey: install.licenseKey,
			account: accountOf(TXADMIN_USERNAME, passwordHash),
			controlToken: install.controlToken,
			databaseHost: DATABASE_HOST,
			databasePort: DATABASE_PORT,
			databaseUser: DATABASE_USER,
			databasePassword: install.databasePassword,
			databaseName: DATABASE_NAME,
		}),
	);
};
