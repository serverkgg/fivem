import { type Bridge, BridgeKind } from "@serverkgg/bridge";

export const SERVER_READY = /Server license key authentication succeeded|Authenticated with cfx\.re Nucleus/;

export const LICENSE_REJECTED = /Could not authenticate server license key[^\n]{0,200}/;

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
		"PlayerLeft",
		"ServerStopping",
	],
};
