import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { dumpDatabase } from "../shared";

const SETTLE_SECONDS = 3;

export const backup: Bridge.Backup = {
	kind: BridgeKind.Backup,
	settleSeconds: SETTLE_SECONDS,
	async quiesce(context) {
		// The live InnoDB files are never archived; a logical dump taken here is
		// what the backup carries, so a restore lands on a consistent database.
		await dumpDatabase(context);
	},
};
