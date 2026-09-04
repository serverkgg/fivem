import type { Bridge } from "@serverkgg/bridge";
import { serverPaths } from "./fivemServerPaths";
import { ONESYNC_SETTING, onesyncOf, TXADMIN_CONFIG_FILE, withOnesync } from "./fivemTxAdmin";
import { type ConfigDirective, readDirective, writeDirectives } from "./serverConfig";

export enum SettingKind {
	Text = "text",
	Number = "number",
	Toggle = "toggle",
}

interface SettingBinding {
	key: string;
	command: string;
	quote: boolean;
	kind: SettingKind;
	on?: string;
	off?: string;
}

export const SETTING_BINDINGS: SettingBinding[] = [
	{
		key: "sv_hostname",
		command: "sv_hostname",
		quote: true,
		kind: SettingKind.Text,
	},
	{
		key: "sv_projectName",
		command: "sets sv_projectName",
		quote: true,
		kind: SettingKind.Text,
	},
	{
		key: "sv_projectDesc",
		command: "sets sv_projectDesc",
		quote: true,
		kind: SettingKind.Text,
	},
	{
		key: "sv_maxclients",
		command: "sv_maxclients",
		quote: false,
		kind: SettingKind.Number,
	},
	{
		key: "locale",
		command: "sets locale",
		quote: true,
		kind: SettingKind.Text,
	},
	{
		key: "tags",
		command: "sets tags",
		quote: true,
		kind: SettingKind.Text,
	},
	{
		key: "steam_webApiKey",
		command: "set steam_webApiKey",
		quote: true,
		kind: SettingKind.Text,
	},
	{
		key: "sv_scriptHookAllowed",
		command: "sv_scriptHookAllowed",
		quote: false,
		kind: SettingKind.Toggle,
		on: "1",
		off: "0",
	},
];

const TRUTHY = new Set([
	"1",
	"on",
	"true",
	"yes",
]);

const readValue = (binding: SettingBinding, raw: string | null): Bridge.Value => {
	if (raw === null) {
		return null;
	}

	if (binding.kind === SettingKind.Number) {
		const parsed = Number(raw);

		return Number.isFinite(parsed) ? parsed : null;
	}

	if (binding.kind === SettingKind.Toggle) {
		return TRUTHY.has(raw.trim().toLowerCase());
	}

	return raw;
};

const writeValue = (binding: SettingBinding, value: Bridge.Value): string | null => {
	if (value === null) {
		return null;
	}

	if (binding.kind === SettingKind.Toggle) {
		const truthy = typeof value === "boolean" ? value : TRUTHY.has(String(value).trim().toLowerCase());

		return truthy ? (binding.on ?? "1") : (binding.off ?? "0");
	}

	if (binding.kind === SettingKind.Number) {
		const parsed = Number(value);

		return Number.isFinite(parsed) ? String(Math.trunc(parsed)) : null;
	}

	return String(value);
};

export const settingsOf = (content: string): Bridge.Values => {
	const values: Bridge.Values = {};

	for (const binding of SETTING_BINDINGS) {
		values[binding.key] = readValue(binding, readDirective(content, binding.command));
	}

	return values;
};

export const settingDirectives = (values: Bridge.Values): ConfigDirective[] => {
	const directives: ConfigDirective[] = [];

	for (const binding of SETTING_BINDINGS) {
		if (!Object.hasOwn(values, binding.key)) {
			continue;
		}

		const value = writeValue(binding, values[binding.key] ?? null);

		if (value === null) {
			continue;
		}

		directives.push({
			command: binding.command,
			value,
			quote: binding.quote,
		});
	}

	return directives;
};

export const readServerConfig = async (context: Bridge.Context) => {
	const { cfgPath } = await serverPaths(context);

	if (!(await context.files.exists(cfgPath))) {
		return "";
	}

	return await context.files.read(cfgPath);
};

export const applyDirectives = async (context: Bridge.Context, directives: ConfigDirective[]) => {
	if (directives.length === 0) {
		return;
	}

	const { cfgPath } = await serverPaths(context);
	const content = (await context.files.exists(cfgPath)) ? await context.files.read(cfgPath) : "";

	await context.files.write(cfgPath, writeDirectives(content, directives));
};

const readOnesync = async (context: Bridge.Context) => {
	if (!(await context.files.exists(TXADMIN_CONFIG_FILE))) {
		return null;
	}

	return onesyncOf(await context.files.read(TXADMIN_CONFIG_FILE));
};

const writeOnesync = async (context: Bridge.Context, value: Bridge.Value) => {
	if (value === null || !(await context.files.exists(TXADMIN_CONFIG_FILE))) {
		return;
	}

	const enabled = typeof value === "boolean" ? value : TRUTHY.has(String(value).trim().toLowerCase());
	const written = withOnesync(await context.files.read(TXADMIN_CONFIG_FILE), enabled);

	if (written !== null) {
		await context.files.write(TXADMIN_CONFIG_FILE, written);
	}
};

export const readSettings = async (context: Bridge.Context): Promise<Bridge.Values> => {
	return {
		...settingsOf(await readServerConfig(context)),
		[ONESYNC_SETTING]: await readOnesync(context),
	};
};

export const writeSettings = async (context: Bridge.Context, values: Bridge.Values) => {
	await applyDirectives(context, settingDirectives(values));

	if (Object.hasOwn(values, ONESYNC_SETTING)) {
		await writeOnesync(context, values[ONESYNC_SETTING] ?? null);
	}
};
