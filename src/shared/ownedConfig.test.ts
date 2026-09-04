import { describe, expect, test } from "bun:test";
import { isLicenseKey, LICENSE_KEY_PATTERN, ownedDirectives } from "./ownedConfig";

const PORTAL_KEY = "cfxk_1a2b3c4d5e6f7g8h9i0j1_zz9xk2";

const OLD_KEY = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6";

const licenseValue = (key: string | null) => {
	return ownedDirectives({
		gamePort: 30_120,
		licenseKey: key,
		connectionString: null,
		playersToken: null,
		controlToken: null,
	}).find((directive) => directive.command === "sv_licenseKey")?.value;
};

describe("the one rule a licence key is judged by", () => {
	test("accepts the shape portal.cfx.re issues today and the old 32-character key", () => {
		expect(isLicenseKey(PORTAL_KEY)).toBe(true);
		expect(isLicenseKey(OLD_KEY)).toBe(true);
	});

	test("refuses anything the pattern refuses", () => {
		expect(isLicenseKey("not-a-key")).toBe(false);
		expect(isLicenseKey("")).toBe(false);
		expect(isLicenseKey(OLD_KEY.slice(1))).toBe(false);
	});

	test("judges the stored value as it stands, the way the panel and the platform judge it", () => {
		expect(isLicenseKey(` ${PORTAL_KEY} `)).toBe(false);
		expect(LICENSE_KEY_PATTERN.test(` ${PORTAL_KEY} `)).toBe(false);
	});

	test("writes sv_licenseKey only for a value that passes that same rule", () => {
		expect(licenseValue(PORTAL_KEY)).toBe(PORTAL_KEY);
		expect(licenseValue(` ${PORTAL_KEY} `)).toBeUndefined();
		expect(licenseValue(null)).toBeUndefined();
	});
});
