import { describe, expect, test } from "bun:test";
import {
	ARTIFACTS_LISTING,
	artifactOfDownload,
	changelogArtifact,
	type FivemChangelog,
	listingArtifact,
	parseArtifacts,
	recommendedArtifact,
	requestedArtifact,
	supportedBuilds,
} from "./fivemArtifacts";

const LISTING = `
<div class="panel-block">
	<a href= "./35245-6efb47dff473c0e2a12fb50b08d74c0eb24a50d5/fx.tar.xz" class="button is-link is-primary">
		LATEST RECOMMENDED (35245)
	</a>&nbsp;
</div>
<a class="panel-block" href="..">..</a>
<a class="panel-block is-active" href="./35805-6fd665a365f56c2582c36d8ffaf301b0b1d5764b/fx.tar.xz" style="display: block;"></a>
<a class="panel-block " href="./35713-03dcc562ca175e24eb018569ecb919b4b7a56824/fx.tar.xz" style="display: block;"></a>
<a class="panel-block is-active" href="./35245-6efb47dff473c0e2a12fb50b08d74c0eb24a50d5/fx.tar.xz" style="display: block;"></a>
`;

describe("parseArtifacts", () => {
	test("reads every build newest first and drops the duplicate", () => {
		expect(parseArtifacts(LISTING).map((artifact) => artifact.build)).toEqual([
			"35805",
			"35713",
			"35245",
		]);
	});

	test("builds the download url from the listing root", () => {
		expect(parseArtifacts(LISTING).at(0)?.url).toBe(
			`${ARTIFACTS_LISTING}35805-6fd665a365f56c2582c36d8ffaf301b0b1d5764b/fx.tar.xz`,
		);
	});

	test("answers empty for a listing with no builds", () => {
		expect(parseArtifacts("<html><body>nothing here</body></html>")).toEqual([]);
	});
});

describe("recommendedArtifact", () => {
	test("picks the build behind the LATEST RECOMMENDED button", () => {
		expect(recommendedArtifact(LISTING)?.build).toBe("35245");
	});

	test("answers null when the button is missing", () => {
		expect(
			recommendedArtifact(
				`<a class="panel-block" href="./35805-6fd665a365f56c2582c36d8ffaf301b0b1d5764b/fx.tar.xz"></a>`,
			),
		).toBeNull();
	});
});

const CHANGELOG: FivemChangelog = {
	recommended: "35245",
	latest: "35805",
	recommended_download: `${ARTIFACTS_LISTING}35245-6efb47dff473c0e2a12fb50b08d74c0eb24a50d5/fx.tar.xz`,
	latest_download: `${ARTIFACTS_LISTING}35805-6fd665a365f56c2582c36d8ffaf301b0b1d5764b/fx.tar.xz`,
	support_policy: {
		"35805": "9999-12-31T23:59:59.9999999",
		"35245": "9999-12-31T23:59:59.9999999",
		"35713": "2026-09-15T14:26:15Z",
		"35574": "2026-09-11T13:40:02Z",
		"34998": "2026-08-28T09:59:10Z",
	},
};

const NOW = new Date("2026-09-04T00:00:00Z");

describe("requestedArtifact", () => {
	test("treats an unset variable as the recommended build", () => {
		expect(requestedArtifact(null)).toBe("recommended");
		expect(requestedArtifact("  ")).toBe("recommended");
	});

	test("keeps an explicit choice", () => {
		expect(requestedArtifact("latest")).toBe("latest");
		expect(requestedArtifact(" 35713 ")).toBe("35713");
	});
});

describe("artifactOfDownload", () => {
	test("reads the build and revision out of a changelog download url", () => {
		expect(artifactOfDownload(CHANGELOG.recommended_download)).toEqual({
			build: "35245",
			reference: "35245-6efb47dff473c0e2a12fb50b08d74c0eb24a50d5",
			url: `${ARTIFACTS_LISTING}35245-6efb47dff473c0e2a12fb50b08d74c0eb24a50d5/fx.tar.xz`,
		});
	});

	test("answers null for anything else", () => {
		expect(artifactOfDownload(undefined)).toBeNull();
		expect(artifactOfDownload("https://example.com/fx.tar.xz")).toBeNull();
	});
});

describe("changelogArtifact", () => {
	test("answers the recommended and the latest builds", () => {
		expect(changelogArtifact(CHANGELOG, "recommended")?.build).toBe("35245");
		expect(changelogArtifact(CHANGELOG, "latest")?.build).toBe("35805");
	});

	test("leaves a pinned build to the listing, which is where the revision is", () => {
		expect(changelogArtifact(CHANGELOG, "35713")).toBeNull();
	});
});

describe("supportedBuilds", () => {
	test("offers only builds whose support window is still open", () => {
		expect(supportedBuilds(CHANGELOG, NOW).map((entry) => entry.build)).toEqual([
			"35713",
			"35574",
		]);
	});

	test("drops every build once they have all expired", () => {
		expect(supportedBuilds(CHANGELOG, new Date("2027-01-01T00:00:00Z"))).toEqual([]);
	});
});

describe("listingArtifact", () => {
	test("resolves the recommended build from the button", () => {
		expect(listingArtifact(LISTING, "recommended").build).toBe("35245");
	});

	test("resolves latest to the newest listed build", () => {
		expect(listingArtifact(LISTING, "latest").build).toBe("35805");
	});

	test("falls back to the newest listed build when the button is missing", () => {
		const listing = LISTING.replace("LATEST RECOMMENDED (35245)", "");

		expect(listingArtifact(listing, "recommended").build).toBe("35805");
	});

	test("pins an explicit build", () => {
		expect(listingArtifact(LISTING, "35713").reference).toBe("35713-03dcc562ca175e24eb018569ecb919b4b7a56824");
	});

	test("accepts a full reference and resolves it by build", () => {
		expect(listingArtifact(LISTING, "35713-03dcc562ca175e24eb018569ecb919b4b7a56824").build).toBe("35713");
	});

	test("refuses a build the listing dropped", () => {
		expect(() => listingArtifact(LISTING, "12345")).toThrow(/is not on the artifacts listing/);
	});

	test("refuses an empty listing", () => {
		expect(() => listingArtifact("<html></html>", "recommended")).toThrow(/carried no linux build/);
	});
});
