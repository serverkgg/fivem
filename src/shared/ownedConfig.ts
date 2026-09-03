import { PANEL_RESOURCE } from "./fivemPaths";
import type { ConfigDirective } from "./serverConfig";

export const LICENSE_VARIABLE = "LICENSE_KEY";

const LICENSE_KEY = /^[A-Za-z0-9_.:-]{8,128}$/;

export const isLicenseKey = (value: string) => {
	return LICENSE_KEY.test(value.trim());
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
