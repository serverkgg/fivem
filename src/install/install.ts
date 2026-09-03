import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import {
	applyDirectives,
	connectionString,
	generateDatabasePassword,
	generatePlayersToken,
	isLicenseKey,
	LICENSE_VARIABLE,
	ownedDirectives,
} from "../shared";
import { installArtifact, isArtifactInstalled, resolveRequestedArtifact } from "./installArtifact";
import { installDatabase, writeDatabaseCredentials } from "./installDatabase";
import { seedPanelResource } from "./installResource";
import { seedServerConfig, seedServerData } from "./installServerData";
import { type InstallStamp, readStamp, writeStamp } from "./installStamp";

const secretOf = (stamp: InstallStamp | null, key: "databasePassword" | "playersToken", fallback: () => string) => {
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

		await seedServerData(context);
		await seedServerConfig(context);
		await seedPanelResource(context);
		await installDatabase(context);

		const databasePassword = secretOf(stamp, "databasePassword", generateDatabasePassword);
		const playersToken = secretOf(stamp, "playersToken", generatePlayersToken);

		await writeDatabaseCredentials(context, databasePassword);

		const licenseKey = context.variable(LICENSE_VARIABLE);

		if (licenseKey === null || !isLicenseKey(licenseKey)) {
			context.log.warn("no licence key yet — fxserver will refuse to start until one is set in the panel");
		}

		await applyDirectives(
			context,
			ownedDirectives({
				gamePort: context.port("game"),
				licenseKey,
				connectionString: connectionString(databasePassword),
				playersToken,
			}),
		);

		await writeStamp(context, {
			build: artifact.build,
			reference: artifact.reference,
			databasePassword,
			playersToken,
		});

		context.log("install complete", {
			build: artifact.build,
		});
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
