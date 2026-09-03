import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { ARTIFACT_LATEST, ARTIFACTS_LISTING, parseArtifacts, recommendedArtifact } from "../shared";

const LISTING_CACHE_SECONDS = 900;

const OPTIONS_TTL_SECONDS = 3600;

const BUILD_LIMIT = 20;

export const artifact: Bridge.Options = {
	kind: BridgeKind.Options,
	ttlSeconds: OPTIONS_TTL_SECONDS,
	async list(context) {
		const listing = await context.net.text(ARTIFACTS_LISTING, {
			cacheSeconds: LISTING_CACHE_SECONDS,
		});

		const recommended = recommendedArtifact(listing);

		const options: Bridge.Option[] = [
			{
				value: ARTIFACT_LATEST,
				label: {
					ar: `الموصى فيه${recommended === null ? "" : ` (${recommended.build})`}`,
					en: `Recommended${recommended === null ? "" : ` (${recommended.build})`}`,
				},
				help: {
					ar: "نحدّثك تلقائيًا لآخر بيلد يوصي فيه Cfx.re. هذا اللي ننصح فيه.",
					en: "Follows the build Cfx.re recommends, and updates on its own. This is the one to pick.",
				},
				latest: true,
			},
		];

		for (const entry of parseArtifacts(listing).slice(0, BUILD_LIMIT)) {
			options.push({
				value: entry.build,
				label: {
					ar: `بيلد ${entry.build}`,
					en: `Build ${entry.build}`,
				},
			});
		}

		return options;
	},
};
