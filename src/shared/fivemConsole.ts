import { type Bridge, BridgeUserError } from "@serverkgg/bridge";
import { ANNOUNCE_MESSAGE_LENGTH } from "./fivemPaths";

const NEWLINES = /[\r\n]+/g;

const RESOURCE_NAME = /^[A-Za-z0-9_.-]{1,64}$/;

export const consoleMessage = (message: string) => {
	return message.replace(NEWLINES, " ").trim().slice(0, ANNOUNCE_MESSAGE_LENGTH);
};

export const messageArgument = (args: Bridge.Values) => {
	return String(args.message ?? "");
};

export const resourceArgument = (args: Bridge.Values) => {
	const name = String(args.resource ?? "").trim();

	if (!RESOURCE_NAME.test(name)) {
		throw new BridgeUserError({
			ar: "اسم الريسورس لازم يكون حروف وأرقام إنجليزية مع - أو _ بس",
			en: "a resource name is letters, digits, dashes and underscores only",
		});
	}

	return name;
};

export const sendAnnounce = async (context: Bridge.Context, message: string) => {
	const text = consoleMessage(message);

	if (text.length === 0) {
		return;
	}

	await context.command(`say ${text}`);
};

export const restartResource = async (context: Bridge.Context, resource: string) => {
	await context.command(`restart ${resource}`);
};
