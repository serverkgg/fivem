import { type Bridge, BridgeKind } from "@serverkgg/bridge";

export const SERVER_READY = /Server license key authentication succeeded|Authenticated with cfx\.re Nucleus/;

// txAdmin prints this once its web server is listening and its admin account is
// loaded (core/boot/startReadyWatcher.ts). It is the container's own service
// coming up, and it happens whether or not the game server authenticates.
export const PANEL_READY = /All ready! Please access/;

export const LICENSE_REJECTED = /Could not authenticate server license key[^\n]{0,200}/;

// The licensing component of FXServer is closed source. LICENSE_CHECKING was read
// off a running dev container on 2026-09-04 — svadhesive prints
// "Authenticating server license key..." before every attempt, and txAdmin respawns
// FXServer every few seconds, so the pair repeats. A key that does not exist is
// rejected by LICENSE_REJECTED, not by the pattern below; LICENSE_INVALID is still
// a guess covering a revoked or lapsed key, which needs a real one to transcribe.
// The setup flow degrades to its Silent phase when none of them ever prints.
export const LICENSE_INVALID = /(invalid|expired) (server )?licen[cs]e key/i;

export const LICENSE_CHECKING = /Authenticating server license key/;

export const events: Bridge.Events = {
	kind: BridgeKind.Events,
	patterns: [
		{
			match: SERVER_READY,
			emit: "ServerStarted",
		},
		{
			match: LICENSE_REJECTED,
			emit: "ServerCrashed",
		},
		{
			match: /Fatal error/,
			emit: "ServerCrashed",
		},
		{
			match: /Could not bind on [^\n]{0,120}/,
			emit: "PortBindFailed",
		},
		{
			match: /Error loading script [^\n]{0,120} in resource (?<resource>[\w.-]{1,64})/,
			emit: "ModCrashed",
		},
		{
			match: /Couldn't find resource (?<resource>[\w.-]{1,64})/,
			emit: "MissingDependency",
		},
	],
	emits: [
		"PlayerJoined",
		"PlayerKicked",
		"PlayerLeft",
		"ServerStopping",
		"ServerUpdated",
	],
};
