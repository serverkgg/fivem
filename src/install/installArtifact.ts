import type { Bridge } from "@serverkgg/bridge";
import { execDetail } from "@serverkgg/bridge/utils";
import {
	ARTIFACT_ARCHIVE,
	ARTIFACT_VARIABLE,
	ARTIFACTS_LISTING,
	CHANGELOG_VERSIONS,
	changelogArtifact,
	type FivemArtifact,
	type FivemChangelog,
	listingArtifact,
	RUN_SCRIPT,
	RUNTIME_DIRECTORY,
	requestedArtifact,
} from "../shared";

const CACHE_SECONDS = 900;

export const readChangelog = async (context: Bridge.Context): Promise<FivemChangelog | null> => {
	try {
		return await context.net.json<FivemChangelog>(CHANGELOG_VERSIONS, {
			cacheSeconds: CACHE_SECONDS,
		});
	} catch (error) {
		context.log.warn("the fivem changelog api did not answer, falling back to the artifacts listing", {
			error: error instanceof Error ? error.message : String(error),
		});

		return null;
	}
};

// Cfx publishes recommended and latest with their download urls on the
// changelog api, which is what the Pterodactyl and Pelican eggs read; the html
// listing is the fallback and the only place a pinned build's revision lives.
export const resolveRequestedArtifact = async (context: Bridge.Context): Promise<FivemArtifact> => {
	const requested = requestedArtifact(context.variable(ARTIFACT_VARIABLE));
	const changelog = await readChangelog(context);
	const resolved = changelog === null ? null : changelogArtifact(changelog, requested);

	if (resolved !== null) {
		return resolved;
	}

	const listing = await context.net.text(ARTIFACTS_LISTING, {
		cacheSeconds: CACHE_SECONDS,
	});

	return listingArtifact(listing, requested);
};

export const isArtifactInstalled = async (context: Bridge.Context) => {
	return (await context.files.exists(RUN_SCRIPT)) && (await context.files.exists(RUNTIME_DIRECTORY));
};

export const installArtifact = async (context: Bridge.Context, artifact: FivemArtifact) => {
	context.log("downloading the fivem server artifact", {
		build: artifact.build,
	});

	await context.files.download(ARTIFACT_ARCHIVE, artifact.url);

	context.log("unpacking the fivem server artifact", {
		build: artifact.build,
	});

	await context.files.remove(RUNTIME_DIRECTORY);
	await context.files.remove(RUN_SCRIPT);

	// fx.tar.xz is a tar.xz carrying hundreds of symlinks, which the bridge zip
	// extractor cannot represent, so tar from the image does the unpacking.
	const result = await context.exec([
		"tar",
		"-xJf",
		ARTIFACT_ARCHIVE,
		"-C",
		".",
	]);

	await context.files.remove(ARTIFACT_ARCHIVE);

	if (result.code !== 0) {
		throw new Error(`unpacking the fivem artifact failed with code ${result.code} — ${execDetail(result)}`);
	}

	if (!(await isArtifactInstalled(context))) {
		throw new Error(`the fivem artifact unpacked but ${RUN_SCRIPT} is missing`);
	}

	context.log("fivem server artifact installed", {
		build: artifact.build,
	});
};
