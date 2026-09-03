import { describe, expect, test } from "bun:test";
import { ARTIFACTS_LISTING, parseArtifacts, recommendedArtifact, resolveArtifact } from "./fivemArtifacts";

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

describe("resolveArtifact", () => {
	test("resolves latest to the recommended build", () => {
		expect(resolveArtifact(LISTING, "latest").build).toBe("35245");
	});

	test("treats an unset variable as latest", () => {
		expect(resolveArtifact(LISTING, null).build).toBe("35245");
		expect(resolveArtifact(LISTING, "  ").build).toBe("35245");
	});

	test("falls back to the newest listed build when the button is missing", () => {
		const listing = LISTING.replace("LATEST RECOMMENDED (35245)", "");

		expect(resolveArtifact(listing, "latest").build).toBe("35805");
	});

	test("pins an explicit build", () => {
		expect(resolveArtifact(LISTING, "35713").reference).toBe("35713-03dcc562ca175e24eb018569ecb919b4b7a56824");
	});

	test("accepts a full reference and resolves it by build", () => {
		expect(resolveArtifact(LISTING, "35713-03dcc562ca175e24eb018569ecb919b4b7a56824").build).toBe("35713");
	});

	test("refuses a build the listing dropped", () => {
		expect(() => resolveArtifact(LISTING, "12345")).toThrow(/is not on the artifacts listing/);
	});

	test("refuses an empty listing", () => {
		expect(() => resolveArtifact("<html></html>", "latest")).toThrow(/carried no linux build/);
	});
});
