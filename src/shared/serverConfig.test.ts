import { describe, expect, test } from "bun:test";
import {
	formatDirective,
	isConfigComment,
	readDirective,
	sanitizeConfigValue,
	tokenizeConfigLine,
	writeDirectives,
} from "./serverConfig";

const CONFIG = [
	"# Only change the IP if you're using a server with multiple network interfaces.",
	'endpoint_add_tcp "0.0.0.0:30120"',
	'endpoint_add_udp "0.0.0.0:30120"',
	"",
	"ensure mapmanager",
	"ensure chat",
	"",
	"sv_scriptHookAllowed 0",
	"",
	'#set rcon_password ""',
	'sets tags "default"',
	'sets locale "root-AQ"',
	'sv_hostname "FXServer, but unconfigured"',
	'sets sv_projectName "My FXServer Project"',
	'sets sv_projectDesc "Default FXServer requiring configuration"',
	"set onesync on",
	"sv_maxclients 48",
	"sv_licenseKey changeme",
	"",
].join("\n");

describe("tokenizeConfigLine", () => {
	test("splits on whitespace and unwraps quotes", () => {
		expect(tokenizeConfigLine('sv_hostname "My cool server"')).toEqual([
			"sv_hostname",
			"My cool server",
		]);
	});

	test("keeps an empty quoted value as a token", () => {
		expect(tokenizeConfigLine('set steam_webApiKey ""')).toEqual([
			"set",
			"steam_webApiKey",
			"",
		]);
	});

	test("answers an empty list for a blank line", () => {
		expect(tokenizeConfigLine("   ")).toEqual([]);
	});
});

describe("isConfigComment", () => {
	test("treats hash, slashes and blank lines as comments", () => {
		expect(isConfigComment("# a note")).toBe(true);
		expect(isConfigComment("   // another")).toBe(true);
		expect(isConfigComment("")).toBe(true);
		expect(isConfigComment("sv_maxclients 48")).toBe(false);
	});
});

describe("sanitizeConfigValue", () => {
	test("drops quotes and control characters", () => {
		expect(sanitizeConfigValue('a "quoted"\nvalue')).toBe("a quoted value");
	});
});

describe("formatDirective", () => {
	test("quotes only what asked for it", () => {
		expect(
			formatDirective({
				command: "sv_hostname",
				value: "مدينة الرياض",
				quote: true,
			}),
		).toBe('sv_hostname "مدينة الرياض"');

		expect(
			formatDirective({
				command: "sv_maxclients",
				value: "32",
				quote: false,
			}),
		).toBe("sv_maxclients 32");
	});
});

describe("readDirective", () => {
	test("reads a one-token command", () => {
		expect(readDirective(CONFIG, "sv_hostname")).toBe("FXServer, but unconfigured");
		expect(readDirective(CONFIG, "sv_maxclients")).toBe("48");
	});

	test("reads a sets command without matching a different key", () => {
		expect(readDirective(CONFIG, "sets sv_projectName")).toBe("My FXServer Project");
		expect(readDirective(CONFIG, "sets sv_projectDesc")).toBe("Default FXServer requiring configuration");
		expect(readDirective(CONFIG, "set onesync")).toBe("on");
	});

	test("ignores commented lines", () => {
		expect(readDirective(CONFIG, "set rcon_password")).toBeNull();
	});

	test("answers null for a command the file does not carry", () => {
		expect(readDirective(CONFIG, "set mysql_connection_string")).toBeNull();
	});
});

describe("writeDirectives", () => {
	test("rewrites a line in place and leaves everything else untouched", () => {
		const written = writeDirectives(CONFIG, [
			{
				command: "sv_hostname",
				value: "سيرفر الرياض",
				quote: true,
			},
		]);

		expect(written).toContain('sv_hostname "سيرفر الرياض"');
		expect(written).toContain("ensure mapmanager");
		expect(written).toContain('sets tags "default"');
		expect(written).not.toContain("FXServer, but unconfigured");
	});

	test("appends a directive the file does not carry", () => {
		const written = writeDirectives(CONFIG, [
			{
				command: "set mysql_connection_string",
				value: "mysql://fivem:pw@127.0.0.1:3306/fivem?charset=utf8mb4",
				quote: true,
			},
		]);

		expect(written).toContain("# added by serverk");
		expect(written).toContain('set mysql_connection_string "mysql://fivem:pw@127.0.0.1:3306/fivem?charset=utf8mb4"');
		expect(written.endsWith("\n")).toBe(true);
	});

	test("collapses a duplicated directive to one line", () => {
		const duplicated = `sv_maxclients 48\nensure chat\nsv_maxclients 64\n`;
		const written = writeDirectives(duplicated, [
			{
				command: "sv_maxclients",
				value: "32",
				quote: false,
			},
		]);

		expect(written).toBe("sv_maxclients 32\nensure chat\n");
	});

	test("never rewrites a commented line", () => {
		const written = writeDirectives(CONFIG, [
			{
				command: "set rcon_password",
				value: "secret",
				quote: true,
			},
		]);

		expect(written).toContain('#set rcon_password ""');
		expect(written).toContain('set rcon_password "secret"');
	});

	test("is stable when run twice", () => {
		const directives = [
			{
				command: "endpoint_add_tcp",
				value: "0.0.0.0:30140",
				quote: true,
			},
			{
				command: "set mysql_connection_string",
				value: "mysql://fivem:pw@127.0.0.1:3306/fivem",
				quote: true,
			},
		];

		const once = writeDirectives(CONFIG, directives);

		expect(writeDirectives(once, directives)).toBe(once);
	});

	test("keeps the file readable when it has no trailing newline", () => {
		expect(
			writeDirectives("sv_maxclients 48", [
				{
					command: "sv_maxclients",
					value: "24",
					quote: false,
				},
			]),
		).toBe("sv_maxclients 24");
	});
});
