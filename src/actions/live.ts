import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { messageArgument, resourceArgument, restartResource, sendAnnounce } from "../shared";

export const live: Bridge.Actions = {
	kind: BridgeKind.Actions,
	requiresRunning: true,
	actions: {
		async announce(context, args) {
			await sendAnnounce(context, messageArgument(args));
		},

		async restartResource(context, args) {
			await restartResource(context, resourceArgument(args));
		},

		async refresh(context) {
			await context.command("refresh");
		},
	},
};
