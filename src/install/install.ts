import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import {
	applyDirectives,
	connectionString,
	generateDatabasePassword,
	generatePanelPassword,
	generatePlayersToken,
	generateToken,
	licenseKeyOf,
	ownedDirectives,
	serverPaths,
} from "../shared";
import { installArtifact, isArtifactInstalled, resolveRequestedArtifact } from "./installArtifact";
import { installDatabase, writeDatabaseCredentials } from "./installDatabase";
import { seedChatResource, seedPanelResource } from "./installResource";
import { seedServerConfig, seedServerData } from "./installServerData";
import { type InstallSecret, type InstallStamp, readStamp, writeStamp } from "./installStamp";
import { seedTxAdminProfile, writeTxAdminEnvironment } from "./installTxAdmin";

const CONTROL_TOKEN_LENGTH = 40;

const secretOf = (stamp: InstallStamp | null, key: InstallSecret, fallback: () => string) => {
	const current = stamp?.[key] ?? "";

	return current.length > 0 ? current : fallback();
};

export const install: Bridge.Install = {
	kind: BridgeKind.Install,
	async run(context) {
		const stamp = await readStamp(context);
		const artifact = await resolveRequestedArtifact(context);
		const installed = await isArtifactInstalled(context);

		if (!installed || stamp?.reference !== artifact.reference) {
			if (installed && stamp !== null) {
				context.log("moving to another fivem build", {
					from: stamp.build,
					to: artifact.build,
				});
			}

			await installArtifact(context, artifact);
		}

		const licenseKey = licenseKeyOf(context);

		await seedServerData(context);

		const profileSeeded = await seedTxAdminProfile(context, licenseKey, stamp?.profileSeeded === true);

		const paths = await serverPaths(context);

		if (paths.deployed) {
			context.log("txadmin is running a server deployed from its own setup page", {
				dataPath: paths.dataPath,
				cfgPath: paths.cfgPath,
			});
		}

		await seedServerConfig(context, paths);
		await seedChatResource(context, paths);
		await seedPanelResource(context, paths);
		await installDatabase(context);

		const databasePassword = secretOf(stamp, "databasePassword", generateDatabasePassword);
		const playersToken = secretOf(stamp, "playersToken", generatePlayersToken);
		const controlToken = secretOf(stamp, "controlToken", () => generateToken(CONTROL_TOKEN_LENGTH));
		const panelPassword = secretOf(stamp, "panelPassword", generatePanelPassword);

		await writeDatabaseCredentials(context, databasePassword);

		await applyDirectives(
			context,
			ownedDirectives({
				gamePort: context.port("game"),
				licenseKey,
				connectionString: connectionString(databasePassword),
				playersToken,
				controlToken,
			}),
		);

		await writeTxAdminEnvironment(context, {
			licenseKey,
			controlToken,
			databasePassword,
			panelPassword,
		});

		await writeStamp(context, {
			build: artifact.build,
			reference: artifact.reference,
			databasePassword,
			playersToken,
			controlToken,
			panelPassword,
			profileSeeded,
		});

		context.log("install complete", {
			build: artifact.build,
		});

		// A missing key is the owner's to fix from the Setup tab, and they can
		// only reach it while the panel is open, so the install persists
		// everything and says what is missing rather than failing the provision.
		if (licenseKey === null) {
			context.log.warn("no cfx.re licence key yet — txadmin will run, the game server will not authenticate");
		}
	},
	async describe(context) {
		const stamp = await readStamp(context);

		return {
			version: stamp?.build ?? null,
			variant: null,
			build: null,
		};
	},
};
