import type { Bridge } from "@serverkgg/bridge";
import { PANEL_RESOURCE } from "./fivemPaths";
import type { ConfigDirective } from "./serverConfig";

export const LICENSE_VARIABLE = "LICENSE_KEY";

// shared/consts.ts in citizenfx/txAdmin: a Portal key is cfxk_<21>_<6> today
// and the 32-character key the old portal issued is still accepted. A key that
// matches neither makes txAdmin fatal-error on TXHOST_DEFAULT_CFXKEY, so the
// panel refuses it before the container ever sees it.
export const LICENSE_KEY_PATTERN = /^(?:cfxk_\w{1,60}_\w{1,20}|\w{32})$/;

// The pattern is tested against the stored value exactly as the platform and the
// web test it, so a value the panel accepted is a value the driver accepts.
export const isLicenseKey = (value: string) => {
	return LICENSE_KEY_PATTERN.test(value);
};

export const licenseKeyOf = (context: Bridge.Context) => {
	const value = context.variable(LICENSE_VARIABLE) ?? "";

	return isLicenseKey(value) ? value : null;
};

export const CONTROL_TOKEN_CONVAR = "serverk_controlToken";

export interface OwnedConfig {
	gamePort: number;
	licenseKey: string | null;
	connectionString: string | null;
	playersToken: string | null;
	controlToken: string | null;
	rconPassword: string;
}

export const ownedDirectives = (owned: OwnedConfig): ConfigDirective[] => {
	const directives: ConfigDirective[] = [
		{
			command: `ensure ${PANEL_RESOURCE}`,
			value: "",
			quote: false,
		},
		// The panel's console, kick and announce paths all reach the game
		// through this resource now that txAdmin owns the process and reads no
		// stdin of its own, so it runs console commands on their behalf.
		{
			command: `add_ace resource.${PANEL_RESOURCE} command`,
			value: "allow",
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

	const license = owned.licenseKey ?? "";

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

	if (owned.controlToken !== null) {
		directives.push({
			command: `set ${CONTROL_TOKEN_CONVAR}`,
			value: owned.controlToken,
			quote: true,
		});
	}

	// FXServer answers RCON on the game port only while rcon_password is set,
	// so the panel's remote access toggle decides whether the line carries the
	// password or stays empty.
	directives.push({
		command: "set rcon_password",
		value: owned.rconPassword,
		quote: true,
	});

	return directives;
};
