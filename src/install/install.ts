import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { writeStamp } from "@serverkgg/bridge/install";
import { rconExposed } from "@serverkgg/bridge/rcon";
import { generateToken } from "@serverkgg/bridge/utils";
import { startingRuntime } from "../setup";
import {
	applyDirectives,
	connectionString,
	generateDatabasePassword,
	generatePanelPassword,
	generatePlayersToken,
	licenseKeyOf,
	liveRconPassword,
	ownedDirectives,
	serverPaths,
} from "../shared";
import { installArtifact, isArtifactInstalled, resolveRequestedArtifact } from "./installArtifact";
import { installDatabase, writeDatabaseCredentials } from "./installDatabase";
import { seedChatResource, seedPanelResource } from "./installResource";
import { seedServerConfig, seedServerData } from "./installServerData";
import { type InstallSecret, type InstallStamp, installStamp } from "./installStamp";
import { seedTxAdminProfile, writeTxAdminEnvironment } from "./installTxAdmin";

const CONTROL_TOKEN_LENGTH = 40;

const secretOf = (stamp: InstallStamp | null, key: InstallSecret, fallback: () => string) => {
	const current = stamp?.[key] ?? "";

	return current.length > 0 ? current : fallback();
};

export const install: Bridge.Install = {
	kind: BridgeKind.Install,
	async run(context) {
		const stamp = await installStamp(context);
		const artifact = await resolveRequestedArtifact(context);
		const installed = await isArtifactInstalled(context);

		if (!installed || stamp?.reference !== artifact.reference) {
			const previousBuild = installed && stamp !== null ? stamp.build : null;

			if (previousBuild !== null) {
				context.log("moving to another fivem build", {
					from: previousBuild,
					to: artifact.build,
				});
			}

			await installArtifact(context, artifact);

			if (previousBuild !== null) {
				context.emit("ServerUpdated", {
					from: previousBuild,
					to: artifact.build,
				});
			}
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
		const rconPassword = liveRconPassword(stamp?.rconPassword ?? "", stamp?.rconPasswordNext ?? "");

		await writeDatabaseCredentials(context, databasePassword);

		await applyDirectives(
			context,
			ownedDirectives({
				gamePort: context.port("game"),
				licenseKey,
				connectionString: connectionString(databasePassword),
				playersToken,
				controlToken,
				rconPassword: rconExposed(context) ? rconPassword : "",
			}),
		);

		await writeTxAdminEnvironment(context, {
			licenseKey,
			controlToken,
			databasePassword,
			panelPassword,
		});

		await writeStamp<InstallStamp>(context, {
			build: artifact.build,
			reference: artifact.reference,
			databasePassword,
			playersToken,
			controlToken,
			panelPassword,
			rconPassword,
			rconPasswordNext: "",
			profileSeeded,
		});

		context.log("install complete", {
			build: artifact.build,
		});

		// A missing key is the owner's to fix from the setup page or the Licence
		// tab, and they can only reach either while the panel is open, so the
		// install persists everything and says what is missing rather than
		// failing the provision.
		if (licenseKey === null) {
			context.log.warn("no cfx.re licence key yet — txadmin will run, the game server will not authenticate");
		}

		context.setup.report(startingRuntime(licenseKey !== null));
	},
	async describe(context) {
		const stamp = await installStamp(context);

		return {
			version: stamp?.build ?? null,
			variant: null,
			build: null,
		};
	},
};
