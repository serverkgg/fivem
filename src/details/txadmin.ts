import { type Bridge, BridgeDetailFormat, BridgeDetailTone, BridgeKind, BridgeUserError } from "@serverkgg/bridge";
import { readStamp } from "../install";
import {
	clearedConfigFile,
	licenseKeyOf,
	serverPaths,
	TXADMIN_CONFIG_FILE,
	TXADMIN_PORT,
	TXADMIN_USERNAME,
} from "../shared";

const REFRESH_SECONDS = 60;

export const SETUP_ACTION = "setup";

export const txadmin: Bridge.Detail = {
	kind: BridgeKind.Detail,
	refreshSeconds: REFRESH_SECONDS,
	async read(context) {
		const stamp = await readStamp(context);
		const password = stamp?.panelPassword ?? "";

		if (password.length === 0) {
			return null;
		}

		const paths = await serverPaths(context);
		const keyed = licenseKeyOf(context) !== null;

		return {
			id: "txadmin",
			title: "txAdmin",
			subtitle: `${TXADMIN_USERNAME} · ${context.port(TXADMIN_PORT)}`,
			description: {
				ar: "لوحة txAdmin الرسمية شغّالة داخل سيرفرك. افتح عنوان txAdmin من صفحة السيرفر وسجّل دخول بالبيانات اللي تحت.",
				en: "The official txAdmin panel runs inside your server. Open the txAdmin address from your server page and sign in with the details below.",
			},
			image: null,
			badges: [
				...(keyed
					? []
					: [
							{
								label: {
									ar: "مفتاح الترخيص ناقص",
									en: "Licence key missing",
								},
								tone: BridgeDetailTone.Warning,
							},
						]),
				{
					label: paths.deployed
						? {
								ar: "ريسيبي منصّبة",
								en: "Recipe deployed",
							}
						: {
								ar: "سيرفر نظيف",
								en: "Vanilla server",
							},
					tone: paths.deployed ? BridgeDetailTone.Success : BridgeDetailTone.Neutral,
				},
			],
			stats: [
				{
					key: "username",
					label: {
						ar: "المستخدم",
						en: "Username",
					},
					value: TXADMIN_USERNAME,
					format: BridgeDetailFormat.Text,
				},
				{
					key: "password",
					label: {
						ar: "كلمة المرور",
						en: "Password",
					},
					value: password,
					format: BridgeDetailFormat.Text,
				},
				{
					key: "port",
					label: {
						ar: "المنفذ",
						en: "Port",
					},
					value: String(context.port(TXADMIN_PORT)),
					format: BridgeDetailFormat.Text,
				},
				{
					key: "data",
					label: {
						ar: "مجلد السيرفر",
						en: "Server data",
					},
					value: paths.dataPath,
					format: BridgeDetailFormat.Text,
				},
			],
			links: [
				{
					label: {
						ar: "شرح txAdmin",
						en: "txAdmin docs",
					},
					url: "https://docs.fivem.net/docs/server-manual/setting-up-a-server-txadmin/",
				},
			],
			stale: false,
			actions: [
				SETUP_ACTION,
			],
		};
	},
	actions: {
		// Clearing the data path is what puts txAdmin back into its Setup state
		// (TxConfigState.Setup in core/txManager.ts), which is the only state its
		// recipe deployer runs from. Everything else in the profile survives.
		async setup(context) {
			if (!(await context.files.exists(TXADMIN_CONFIG_FILE))) {
				throw new BridgeUserError({
					ar: "لوحة txAdmin لسه تتجهّز. شغّل السيرفر مرة وجرّب بعدها.",
					en: "txAdmin is still being set up — start the server once and try again",
				});
			}

			const cleared = clearedConfigFile(await context.files.read(TXADMIN_CONFIG_FILE));

			if (cleared === null) {
				throw new BridgeUserError({
					ar: "ما قدرنا نقرأ إعدادات txAdmin. افتح لنا تذكرة دعم.",
					en: "we could not read the txAdmin profile — open a support ticket",
				});
			}

			await context.files.write(TXADMIN_CONFIG_FILE, cleared);

			context.log("txadmin profile cleared, its setup page runs on the next start");

			return null;
		},
	},
};
