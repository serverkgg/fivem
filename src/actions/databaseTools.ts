import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { importSql, sqlPathArgument } from "../shared";

export const databaseTools: Bridge.Actions = {
	kind: BridgeKind.Actions,
	requiresRunning: true,
	actions: {
		async importSql(context, args) {
			await importSql(context, sqlPathArgument(String(args.path ?? "")));
		},
	},
};
