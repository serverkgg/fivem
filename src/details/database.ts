import { type Bridge, BridgeDetailFormat, BridgeDetailTone, BridgeKind } from "@serverkgg/bridge";
import { installStamp } from "../install";
import {
	connectionString,
	DATABASE_HOST,
	DATABASE_NAME,
	DATABASE_PORT,
	DATABASE_USER,
	restoreDatabase,
} from "../shared";

const REFRESH_SECONDS = 60;

export const RESTORE_ACTION = "restore";

export const database: Bridge.Detail = {
	kind: BridgeKind.Detail,
	refreshSeconds: REFRESH_SECONDS,
	async read(context) {
		const stamp = await installStamp(context);
		const password = stamp?.databasePassword ?? "";

		if (password.length === 0) {
			return null;
		}

		return {
			id: DATABASE_NAME,
			title: "MariaDB",
			subtitle: `${DATABASE_HOST}:${DATABASE_PORT}`,
			description: null,
			image: null,
			badges: [
				{
					label: {
						ar: "داخل سيرفرك",
						en: "Inside your server",
					},
					tone: BridgeDetailTone.Success,
				},
			],
			stats: [
				{
					key: "host",
					label: {
						ar: "العنوان",
						en: "Host",
					},
					value: DATABASE_HOST,
					format: BridgeDetailFormat.Text,
				},
				{
					key: "port",
					label: {
						ar: "المنفذ",
						en: "Port",
					},
					value: String(DATABASE_PORT),
					format: BridgeDetailFormat.Text,
				},
				{
					key: "database",
					label: {
						ar: "قاعدة البيانات",
						en: "Database",
					},
					value: DATABASE_NAME,
					format: BridgeDetailFormat.Text,
				},
				{
					key: "user",
					label: {
						ar: "المستخدم",
						en: "User",
					},
					value: DATABASE_USER,
					format: BridgeDetailFormat.Text,
				},
				{
					key: "password",
					label: {
						ar: "كلمة المرور",
						en: "Password",
					},
					value: password,
					format: BridgeDetailFormat.Secret,
				},
				// The connection string carries the password inside it, so it is the
				// same secret written another way and hides with it.
				{
					key: "connection",
					label: {
						ar: "رابط الاتصال (oxmysql)",
						en: "Connection string (oxmysql)",
					},
					value: connectionString(password),
					format: BridgeDetailFormat.Secret,
				},
			],
			links: [
				{
					label: {
						ar: "شرح oxmysql",
						en: "oxmysql docs",
					},
					url: "https://overextended.dev/oxmysql",
				},
			],
			stale: false,
			actions: [
				RESTORE_ACTION,
			],
		};
	},
	actions: {
		async restore(context) {
			await restoreDatabase(context);

			return null;
		},
	},
};
