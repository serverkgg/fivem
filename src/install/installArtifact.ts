import type { Bridge } from "@serverkgg/bridge";
import {
	ARTIFACT_ARCHIVE,
	ARTIFACT_VARIABLE,
	ARTIFACTS_LISTING,
	type FivemArtifact,
	RUN_SCRIPT,
	RUNTIME_DIRECTORY,
	resolveArtifact,
} from "../shared";

const LISTING_CACHE_SECONDS = 900;

export const resolveRequestedArtifact = async (context: Bridge.Context): Promise<FivemArtifact> => {
	const listing = await context.net.text(ARTIFACTS_LISTING, {
		cacheSeconds: LISTING_CACHE_SECONDS,
	});

	return resolveArtifact(listing, context.variable(ARTIFACT_VARIABLE));
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
		throw new Error(`unpacking the fivem artifact failed with code ${result.code}: ${result.stderr.slice(0, 400)}`);
	}

	if (!(await isArtifactInstalled(context))) {
		throw new Error(`the fivem artifact unpacked but ${RUN_SCRIPT} is missing`);
	}

	context.log("fivem server artifact installed", {
		build: artifact.build,
	});
};
