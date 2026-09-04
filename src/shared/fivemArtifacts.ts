export const ARTIFACTS_LISTING = "https://runtime.fivem.net/artifacts/fivem/build_proot_linux/master/";

export const CHANGELOG_VERSIONS = "https://changelogs-live.fivem.net/api/changelog/versions/linux/server";

export const ARTIFACT_VARIABLE = "ARTIFACT";

export const ARTIFACT_RECOMMENDED = "recommended";

export const ARTIFACT_LATEST = "latest";

const ENTRY_PATTERN = /href\s*=\s*"\.\/(\d{3,7})-([0-9a-f]{7,40})\/fx\.tar\.xz"/gi;

const RECOMMENDED_PATTERN = /href\s*=\s*"\.\/(\d{3,7})-([0-9a-f]{7,40})\/fx\.tar\.xz"[^>]*>\s*LATEST RECOMMENDED/i;

const DOWNLOAD_PATTERN = /\/(\d{3,7})-([0-9a-f]{7,40})\/fx\.tar\.xz$/;

// Cfx marks a build that never expires with a year-9999 date; everything else
// carries the day its end-of-life warnings start printing in the console.
const NEVER_EXPIRES = "9999";

export interface FivemArtifact {
	build: string;
	reference: string;
	url: string;
}

export interface FivemChangelog {
	recommended?: string;
	latest?: string;
	recommended_download?: string;
	latest_download?: string;
	support_policy?: Record<string, string>;
}

export interface FivemBuild {
	build: string;
	supportedUntil: string | null;
}

const artifactOf = (build: string, revision: string): FivemArtifact => {
	const reference = `${build}-${revision}`;

	return {
		build,
		reference,
		url: `${ARTIFACTS_LISTING}${reference}/fx.tar.xz`,
	};
};

export const artifactOfDownload = (download: string | undefined): FivemArtifact | null => {
	const match = DOWNLOAD_PATTERN.exec(download ?? "");
	const build = match?.[1];
	const revision = match?.[2];

	if (build === undefined || revision === undefined) {
		return null;
	}

	return artifactOf(build, revision);
};

export const parseArtifacts = (html: string): FivemArtifact[] => {
	const seen = new Set<string>();
	const artifacts: FivemArtifact[] = [];

	ENTRY_PATTERN.lastIndex = 0;

	let match = ENTRY_PATTERN.exec(html);

	while (match) {
		const [, build, revision] = match;

		if (build !== undefined && revision !== undefined && !seen.has(build)) {
			seen.add(build);
			artifacts.push(artifactOf(build, revision));
		}

		match = ENTRY_PATTERN.exec(html);
	}

	// Newest build first, so the option list reads naturally and the fallback
	// when the LATEST RECOMMENDED button is missing is simply the first entry.
	return artifacts.sort((left, right) => Number(right.build) - Number(left.build));
};

export const recommendedArtifact = (html: string): FivemArtifact | null => {
	const match = RECOMMENDED_PATTERN.exec(html);
	const build = match?.[1];
	const revision = match?.[2];

	if (build === undefined || revision === undefined) {
		return null;
	}

	return artifactOf(build, revision);
};

export const isSupported = (supportedUntil: string | null, now: Date) => {
	if (supportedUntil === null) {
		return false;
	}

	if (supportedUntil.startsWith(NEVER_EXPIRES)) {
		return true;
	}

	const parsed = Date.parse(supportedUntil);

	return Number.isFinite(parsed) && parsed > now.getTime();
};

// Cfx keeps hundreds of builds on the listing and expires almost all of them
// within days, so only the ones whose support window is still open are worth
// offering as a pin.
export const supportedBuilds = (changelog: FivemChangelog, now: Date): FivemBuild[] => {
	const policy = changelog.support_policy ?? {};
	const excluded = new Set([
		changelog.recommended,
		changelog.latest,
	]);

	return Object.entries(policy)
		.filter(([build, until]) => !excluded.has(build) && isSupported(until, now))
		.map(([build, until]) => ({
			build,
			supportedUntil: until,
		}))
		.sort((left, right) => Number(right.build) - Number(left.build));
};

export const requestedArtifact = (requested: string | null) => {
	const wanted = (requested ?? "").trim();

	return wanted.length === 0 ? ARTIFACT_RECOMMENDED : wanted;
};

export const changelogArtifact = (changelog: FivemChangelog, requested: string): FivemArtifact | null => {
	if (requested === ARTIFACT_RECOMMENDED) {
		return artifactOfDownload(changelog.recommended_download);
	}

	if (requested === ARTIFACT_LATEST) {
		return artifactOfDownload(changelog.latest_download);
	}

	return null;
};

export const listingArtifact = (html: string, requested: string): FivemArtifact => {
	const artifacts = parseArtifacts(html);

	if (requested === ARTIFACT_RECOMMENDED) {
		const resolved = recommendedArtifact(html) ?? artifacts.at(0);

		if (!resolved) {
			throw new Error("the fivem artifacts listing carried no linux build");
		}

		return resolved;
	}

	if (requested === ARTIFACT_LATEST) {
		const resolved = artifacts.at(0);

		if (!resolved) {
			throw new Error("the fivem artifacts listing carried no linux build");
		}

		return resolved;
	}

	const build = requested.split("-").at(0) ?? requested;
	const resolved = artifacts.find((artifact) => artifact.build === build);

	if (!resolved) {
		throw new Error(`fivem build "${requested}" is not on the artifacts listing any more`);
	}

	return resolved;
};
