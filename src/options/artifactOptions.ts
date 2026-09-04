import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { readChangelog } from "../install";
import {
	ARTIFACT_LATEST,
	ARTIFACT_RECOMMENDED,
	ARTIFACTS_LISTING,
	type FivemChangelog,
	parseArtifacts,
	recommendedArtifact,
	supportedBuilds,
} from "../shared";

const LISTING_CACHE_SECONDS = 900;

const OPTIONS_TTL_SECONDS = 3600;

const BUILD_LIMIT = 20;

const labelled = (build: string | undefined) => {
	return build === undefined ? "" : ` (${build})`;
};

const changelogOptions = (changelog: FivemChangelog, now: Date): Bridge.Option[] => {
	const options: Bridge.Option[] = [
		{
			value: ARTIFACT_RECOMMENDED,
			label: {
				ar: `الموصى فيه${labelled(changelog.recommended)}`,
				en: `Recommended${labelled(changelog.recommended)}`,
			},
			help: {
				ar: "نحدّثك تلقائيًا لآخر بيلد يوصي فيه Cfx.re. هذا اللي ننصح فيه.",
				en: "Follows the build Cfx.re recommends, and updates on its own. This is the one to pick.",
			},
			latest: true,
		},
		{
			value: ARTIFACT_LATEST,
			label: {
				ar: `الأحدث${labelled(changelog.latest)}`,
				en: `Latest${labelled(changelog.latest)}`,
			},
			help: {
				ar: "آخر بيلد نزل، حتى لو Cfx.re ما وصّى فيه بعد. للمطورين اللي يبون شي جديد.",
				en: "The newest build Cfx.re published, recommended or not. For developers who need something new.",
			},
		},
	];

	// Cfx expires almost every non-recommended build within days, and an expired
	// one starts printing end-of-life warnings in the owner's console, so only
	// the builds still inside their support window are worth pinning.
	for (const entry of supportedBuilds(changelog, now).slice(0, BUILD_LIMIT)) {
		options.push({
			value: entry.build,
			label: {
				ar: `بيلد ${entry.build}`,
				en: `Build ${entry.build}`,
			},
		});
	}

	return options;
};

export const artifact: Bridge.Options = {
	kind: BridgeKind.Options,
	ttlSeconds: OPTIONS_TTL_SECONDS,
	async list(context) {
		const changelog = await readChangelog(context);

		if (changelog !== null) {
			return changelogOptions(changelog, new Date());
		}

		const listing = await context.net.text(ARTIFACTS_LISTING, {
			cacheSeconds: LISTING_CACHE_SECONDS,
		});

		const recommended = recommendedArtifact(listing);
		const artifacts = parseArtifacts(listing);

		return changelogOptions(
			{
				recommended: recommended?.build,
				latest: artifacts.at(0)?.build,
			},
			new Date(),
		);
	},
};
