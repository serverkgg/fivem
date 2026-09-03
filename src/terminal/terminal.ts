import { type Bridge, BridgeKind, BridgeTerminalLevel } from "@serverkgg/bridge";

const player: Bridge.TerminalArg = {
	key: "player",
	label: {
		ar: "اللاعب",
		en: "Player",
	},
	required: true,
	module: "players",
	column: "id",
};

const commands: Bridge.TerminalCommand[] = [
	{
		name: "say",
		summary: {
			ar: "رسالة تظهر لكل اللاعبين في الشات.",
			en: "Send a chat message to everyone.",
		},
		syntax: "say <message>",
	},
	{
		name: "ensure",
		summary: {
			ar: "يشغّل ريسورس، وإذا كان شغّال يعيد تشغيله.",
			en: "Start a resource, restarting it when it already runs.",
		},
		syntax: "ensure <resource>",
	},
	{
		name: "restart",
		summary: {
			ar: "يعيد تشغيل ريسورس شغّال.",
			en: "Restart a running resource.",
		},
		syntax: "restart <resource>",
	},
	{
		name: "start",
		summary: {
			ar: "يشغّل ريسورس متوقف.",
			en: "Start a stopped resource.",
		},
		syntax: "start <resource>",
	},
	{
		name: "stop",
		summary: {
			ar: "يوقف ريسورس شغّال.",
			en: "Stop a running resource.",
		},
		syntax: "stop <resource>",
	},
	{
		name: "refresh",
		summary: {
			ar: "يعيد قراءة مجلد الريسورسات بعد ما تضيف واحد جديد.",
			en: "Rescan the resources folder after adding one.",
		},
	},
	{
		name: "exec",
		summary: {
			ar: "ينفّذ ملف cfg من مجلد server-data.",
			en: "Run a cfg file from the server-data folder.",
		},
		syntax: "exec <file.cfg>",
	},
	{
		name: "serverk_kick",
		summary: {
			ar: "يطرد لاعب برقمه، مع سبب اختياري.",
			en: "Kick a player by id, with an optional reason.",
		},
		syntax: "serverk_kick <player> [reason]",
		args: [
			player,
		],
	},
	{
		name: "load_server_icon",
		summary: {
			ar: "يحمّل أيقونة السيرفر — ملف PNG مقاس 96x96.",
			en: "Load the server icon — a 96x96 PNG file.",
		},
		syntax: "load_server_icon <file.png>",
	},
	{
		name: "quit",
		summary: {
			ar: "يوقف السيرفر.",
			en: "Stop the server.",
		},
		syntax: "quit [reason]",
		danger: true,
	},
];

const rules: Bridge.TerminalRule[] = [
	{
		match: /\bFatal error\b/,
		level: BridgeTerminalLevel.Error,
	},
	{
		match: /^\s*\[[^\]]*\]\s*(?:Error|SCRIPT ERROR):/,
		level: BridgeTerminalLevel.Error,
	},
	{
		match: /Could not authenticate server license key/,
		level: BridgeTerminalLevel.Error,
	},
	{
		match: /Couldn't find resource/,
		level: BridgeTerminalLevel.Warn,
	},
	{
		match: /\bwarning:/i,
		level: BridgeTerminalLevel.Warn,
	},
];

export const terminal: Bridge.Terminal = {
	kind: BridgeKind.Terminal,
	commands,
	rules,
};
