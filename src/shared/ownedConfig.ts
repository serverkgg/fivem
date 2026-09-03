import { type Bridge, BridgeUserError } from "@serverkgg/bridge";
import { PANEL_RESOURCE } from "./fivemPaths";
import type { ConfigDirective } from "./serverConfig";

export const LICENSE_VARIABLE = "LICENSE_KEY";

const LICENSE_KEY = /^[A-Za-z0-9_.:-]{8,128}$/;

export const isLicenseKey = (value: string) => {
	return LICENSE_KEY.test(value.trim());
};

export const licenseKeyOf = (context: Bridge.Context) => {
	const value = context.variable(LICENSE_VARIABLE) ?? "";

	return isLicenseKey(value) ? value.trim() : null;
};

// FXServer exits within a second when sv_licenseKey is unset, so without this
// the supervisor reads five crash-restarts and trips its breaker. The bridge
// has no hold that can ask for a value rather than a file, so the honest stop
// is an error carrying the one sentence the owner can act on.
export const requireLicenseKey = (context: Bridge.Context) => {
	const licenseKey = licenseKeyOf(context);

	if (licenseKey === null) {
		throw new BridgeUserError({
			ar: "سيرفرك يبي مفتاح ترخيص من Cfx.re عشان يشتغل. سوّ مفتاح من portal.cfx.re/servers/registration-keys والصقه في تبويب التجهيز.",
			en: "your server needs a Cfx.re licence key to run — create one at portal.cfx.re/servers/registration-keys and paste it into the Setup tab",
		});
	}

	return licenseKey;
};

export interface OwnedConfig {
	gamePort: number;
	licenseKey: string | null;
	connectionString: string | null;
	playersToken: string | null;
}

export const ownedDirectives = (owned: OwnedConfig): ConfigDirective[] => {
	const directives: ConfigDirective[] = [
		{
			command: `ensure ${PANEL_RESOURCE}`,
			value: "",
			quote: false,
		},
		{
			command: "endpoint_add_tcp",
			value: `0.0.0.0:${owned.gamePort}`,
			quote: true,
		},
		{
			command: "endpoint_add_udp",
			value: `0.0.0.0:${owned.gamePort}`,
			quote: true,
		},
	];

	const license = owned.licenseKey?.trim() ?? "";

	if (isLicenseKey(license)) {
		directives.push({
			command: "sv_licenseKey",
			value: license,
			quote: false,
		});
	}

	if (owned.playersToken !== null) {
		directives.push({
			command: "set sv_playersToken",
			value: owned.playersToken,
			quote: true,
		});
	}

	if (owned.connectionString !== null) {
		directives.push({
			command: "set mysql_connection_string",
			value: owned.connectionString,
			quote: true,
		});
	}

	return directives;
};
