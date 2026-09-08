import { BridgeUserError } from "@serverkgg/bridge";
import { writeStamp } from "@serverkgg/bridge/install";
import { createRconAccess, type RconAccessPassword } from "@serverkgg/bridge/rcon";
import { type InstallStamp, installStamp } from "../install";
import { generateRconPassword } from "../shared";

export const rconPasswordOf = (stamp: InstallStamp | null): RconAccessPassword | null => {
	const next = stamp?.rconPasswordNext ?? "";
	const current = stamp?.rconPassword ?? "";

	if (next.length === 0 && current.length === 0) {
		return null;
	}

	return {
		value: next.length > 0 ? next : current,
		pending: next.length > 0,
	};
};

export const rconAccess = createRconAccess({
	portKey: "game",
	tools: {
		ar: "IceCon هي الأداة المعتادة، ولوحة txAdmin تبقى لوحة الإدارة الأساسية.",
		en: "IceCon is the usual client; txAdmin stays the main admin panel.",
	},
	async password(context) {
		return rconPasswordOf(await installStamp(context));
	},
	async rotate(context) {
		const stamp = await installStamp(context);

		if (stamp === null) {
			throw new BridgeUserError({
				ar: "شغّل سيرفرك مرة عشان تتولد كلمة المرور، وبعدها غيّرها.",
				en: "start your server once so the password is generated, then rotate it",
			});
		}

		await writeStamp<InstallStamp>(context, {
			...stamp,
			rconPasswordNext: generateRconPassword(),
		});
	},
});
