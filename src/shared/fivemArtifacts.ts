export const ARTIFACTS_LISTING = "https://runtime.fivem.net/artifacts/fivem/build_proot_linux/master/";

export const ARTIFACT_VARIABLE = "ARTIFACT";

export const ARTIFACT_LATEST = "latest";

const ENTRY_PATTERN = /href\s*=\s*"\.\/(\d{3,7})-([0-9a-f]{7,40})\/fx\.tar\.xz"/gi;

const RECOMMENDED_PATTERN = /href\s*=\s*"\.\/(\d{3,7})-([0-9a-f]{7,40})\/fx\.tar\.xz"[^>]*>\s*LATEST RECOMMENDED/i;

export interface FivemArtifact {
	build: string;
	reference: string;
	url: string;
}

const artifactOf = (build: string, revision: string): FivemArtifact => {
	const reference = `${build}-${revision}`;

	return {
		build,
		reference,
		url: `${ARTIFACTS_LISTING}${reference}/fx.tar.xz`,
	};
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

export const resolveArtifact = (html: string, requested: string | null): FivemArtifact => {
	const artifacts = parseArtifacts(html);
	const wanted = (requested ?? "").trim();

	if (wanted.length === 0 || wanted === ARTIFACT_LATEST) {
		const resolved = recommendedArtifact(html) ?? artifacts.at(0);

		if (!resolved) {
			throw new Error("the fivem artifacts listing carried no linux build");
		}

		return resolved;
	}

	const build = wanted.split("-").at(0) ?? wanted;
	const resolved = artifacts.find((artifact) => artifact.build === build);

	if (!resolved) {
		throw new Error(`fivem build "${wanted}" is not on the artifacts listing any more`);
	}

	return resolved;
};
