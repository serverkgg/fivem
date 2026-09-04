import {
	type Bridge,
	BridgeConfirm,
	BridgeControl,
	BridgeFormTarget,
	BridgeIcon,
	BridgeLayout,
} from "@serverkgg/bridge";
import {
	ANNOUNCE_MESSAGE_LENGTH,
	ARTIFACT_VARIABLE,
	LICENSE_KEY_PATTERN,
	LICENSE_VARIABLE,
	MAX_SLOT_LIMIT,
} from "../shared";

const licenseTab: Bridge.Tab = {
	id: "license",
	title: {
		ar: "الترخيص",
		en: "Licence",
	},
	icon: BridgeIcon.Rocket,
	sections: [
		{
			layout: BridgeLayout.Form,
			id: "license",
			title: {
				ar: "مفتاح الترخيص والبيلد",
				en: "Licence key and build",
			},
			target: BridgeFormTarget.Variables,
			reinstall: true,
			confirm: BridgeConfirm.Normal,
			confirmText: {
				ar: "نعيد تجهيز السيرفر ونشغّله من جديد. ملفاتك ومابك وقاعدة بياناتك كلها تبقى مكانها.",
				en: "We reinstall and restart the server. Your files, your resources and your database all stay where they are.",
			},
			fields: [
				{
					key: LICENSE_VARIABLE,
					control: BridgeControl.Secret,
					label: {
						ar: "مفتاح الترخيص (Licence key)",
						en: "Licence key",
					},
					help: {
						ar: "سوّ حساب في portal.cfx.re، أنشئ مفتاح جديد باسم تختاره، والصقه هنا. المفتاح يبدأ بـ cfxk_ وبعده مقطعين بينهم _ ، أو يكون مفتاح قديم من 32 حرف. بدونه فايف إم ما يشتغل.",
						en: "Create an account on portal.cfx.re, generate a key under any display name, and paste it here. A key starts with cfxk_ followed by two underscore-separated parts, or is an old 32-character key. FiveM will not run without one.",
					},
					placeholder: "cfxk_xxxxxxxxxxxxxxxxxxxxx_xxxxxx",
					maxLength: 64,
					pattern: LICENSE_KEY_PATTERN.source,
					patternHint: {
						ar: "المفتاح يبدأ بـ cfxk_ وبعده مقطعين بينهم _ ، أو مفتاح قديم من 32 حرف.",
						en: "A key starts with cfxk_ followed by two underscore-separated parts, or is an old 32-character key.",
					},
				},
				{
					key: ARTIFACT_VARIABLE,
					control: BridgeControl.Select,
					label: {
						ar: "نسخة السيرفر (Artifact)",
						en: "Server build",
					},
					help: {
						ar: "خلها على الموصى فيه إلا إذا مودك يبي بيلد محدد.",
						en: "Leave it on the recommended build unless a script of yours needs a specific one.",
					},
					options: {
						module: "artifact",
					},
				},
			],
		},
		{
			layout: BridgeLayout.Detail,
			id: "txadmin",
			title: {
				ar: "لوحة txAdmin",
				en: "The txAdmin panel",
			},
			module: "txadmin",
			actions: [
				{
					id: "setup",
					label: {
						ar: "افتح صفحة التنصيب",
						en: "Open the setup page",
					},
					confirm: BridgeConfirm.Strong,
					confirmText: {
						ar: "نرجّع txAdmin لصفحة التنصيب عشان تختار ريسيبي زي ESX أو QBCore. سيرفرك الحالي وملفاته تبقى مكانها، بس السيرفر ما يشتغل لين تخلّص التنصيب من المتصفح.",
						en: "We send txAdmin back to its setup page so you can pick a recipe like ESX or QBCore. Your current files stay where they are, but the server will not start again until you finish the setup in the browser.",
					},
				},
			],
			empty: {
				ar: "لوحة txAdmin لسه تتجهّز. افتح التبويب بعد ما يخلص التركيب.",
				en: "txAdmin is still being set up. Come back once the install finishes.",
			},
		},
	],
};

const settingsTab: Bridge.Tab = {
	id: "settings",
	title: {
		ar: "الإعدادات",
		en: "Settings",
	},
	icon: BridgeIcon.Settings,
	sections: [
		{
			layout: BridgeLayout.Form,
			id: "server",
			target: BridgeFormTarget.Settings,
			module: "settings",
			restartHint: true,
			fields: [
				{
					key: "sv_hostname",
					control: BridgeControl.Text,
					label: {
						ar: "اسم السيرفر",
						en: "Server name",
					},
					help: {
						ar: "الاسم اللي يظهر للاعبين في قائمة السيرفرات.",
						en: "Shown to players in the server browser.",
					},
					maxLength: 96,
				},
				{
					key: "sv_projectName",
					control: BridgeControl.Text,
					label: {
						ar: "اسم المشروع",
						en: "Project name",
					},
					help: {
						ar: "يظهر في صفحة السيرفر على cfx.re.",
						en: "Shown on your server page on cfx.re.",
					},
					maxLength: 64,
				},
				{
					key: "sv_projectDesc",
					control: BridgeControl.Text,
					label: {
						ar: "وصف المشروع",
						en: "Project description",
					},
					maxLength: 128,
				},
				{
					key: "sv_maxclients",
					control: BridgeControl.Number,
					label: {
						ar: "أقصى عدد لاعبين",
						en: "Max players",
					},
					help: {
						ar: "48 هو الحد المجاني من Cfx.re. فوق 48 يبي اشتراك Element Club على حسابك، وفوق 64 لازم OneSync يكون مفعّل.",
						en: "48 is the free Cfx.re cap. Above 48 needs an Element Club subscription on your own account, and above 64 needs OneSync on.",
					},
					min: 1,
					max: MAX_SLOT_LIMIT,
				},
				{
					key: "steam_webApiKey",
					control: BridgeControl.Secret,
					label: {
						ar: "مفتاح Steam Web API",
						en: "Steam Web API key",
					},
					help: {
						ar: "اختياري. لما تحطه يقدر السيرفر يقرأ معرّف ستيم للاعبين، وبعض السكربتات تبيه.",
						en: "Optional. With one set the server can read players' Steam identifiers, which some scripts need.",
					},
					placeholder: "steamcommunity.com/dev/apikey",
					maxLength: 64,
				},
				{
					key: "locale",
					control: BridgeControl.Select,
					label: {
						ar: "لغة السيرفر",
						en: "Server locale",
					},
					options: [
						{
							value: "ar-SA",
							label: {
								ar: "عربي (السعودية)",
								en: "Arabic (Saudi Arabia)",
							},
						},
						{
							value: "ar-AE",
							label: {
								ar: "عربي (الإمارات)",
								en: "Arabic (UAE)",
							},
						},
						{
							value: "ar-EG",
							label: {
								ar: "عربي (مصر)",
								en: "Arabic (Egypt)",
							},
						},
						{
							value: "en-US",
							label: {
								ar: "إنجليزي",
								en: "English",
							},
						},
					],
				},
				{
					key: "tags",
					control: BridgeControl.Text,
					label: {
						ar: "الوسوم",
						en: "Tags",
					},
					help: {
						ar: "كلمات مفصولة بفواصل، تساعد اللاعبين يلقون سيرفرك. مثال: roleplay, arabic, drift",
						en: "Comma-separated words that help players find your server. Example: roleplay, arabic, drift",
					},
					maxLength: 128,
				},
				{
					key: "onesync",
					control: BridgeControl.Boolean,
					label: {
						ar: "OneSync",
						en: "OneSync",
					},
					help: {
						ar: "لازم يكون مفعّل لأغلب فريموركات الرول بلاي زي ESX و QBCore. نكتبه في إعدادات txAdmin، لأنها هي اللي تشغّل السيرفر.",
						en: "Most roleplay frameworks, ESX and QBCore included, need this on. We write it into txAdmin's own settings, because txAdmin is what starts the server.",
					},
				},
				{
					key: "sv_scriptHookAllowed",
					control: BridgeControl.Boolean,
					label: {
						ar: "السماح بـ ScriptHook",
						en: "Allow ScriptHook",
					},
					warning: {
						ar: "لما تفعّله، يقدر اللاعبين يشغّلون مودات ومنيوهات غش من طرفهم.",
						en: "When on, players can run their own script-hook plugins and menus, cheat menus included.",
					},
				},
			],
		},
	],
};

const playersTab: Bridge.Tab = {
	id: "players",
	title: {
		ar: "اللاعبين",
		en: "Players",
	},
	icon: BridgeIcon.Users,
	sections: [
		{
			layout: BridgeLayout.Table,
			id: "online",
			module: "players",
			columns: [
				{
					key: "name",
					label: {
						ar: "اللاعب",
						en: "Player",
					},
				},
				{
					key: "id",
					label: {
						ar: "الرقم",
						en: "ID",
					},
				},
				{
					key: "ping",
					label: {
						ar: "البنق",
						en: "Ping",
					},
				},
				{
					key: "identifier",
					label: {
						ar: "المعرّف",
						en: "Identifier",
					},
				},
			],
			actions: [
				{
					id: "kick",
					label: {
						ar: "طرد",
						en: "Kick",
					},
					confirm: BridgeConfirm.Normal,
				},
			],
			empty: {
				ar: "ما فيه أحد داخل الحين.",
				en: "Nobody is online right now.",
			},
		},
	],
};

const databaseTab: Bridge.Tab = {
	id: "database",
	title: {
		ar: "قاعدة البيانات",
		en: "Database",
	},
	icon: BridgeIcon.Box,
	sections: [
		{
			layout: BridgeLayout.Detail,
			id: "mariadb",
			title: {
				ar: "بيانات الاتصال",
				en: "Connection details",
			},
			module: "database",
			confirm: BridgeConfirm.Strong,
			confirmText: {
				ar: "نرجّع قاعدة البيانات من آخر نسخة أخذناها مع النسخة الاحتياطية، وكل اللي بعدها يروح.",
				en: "We restore the database from the dump inside your latest backup — everything written since is lost.",
			},
			actions: [
				{
					id: "restore",
					label: {
						ar: "استرجع قاعدة البيانات",
						en: "Restore the database",
					},
					confirm: BridgeConfirm.Strong,
					confirmText: {
						ar: "نرجّع قاعدة البيانات من آخر نسخة أخذناها مع النسخة الاحتياطية، وكل اللي بعدها يروح.",
						en: "We restore the database from the dump inside your latest backup — everything written since is lost.",
					},
				},
			],
			empty: {
				ar: "قاعدة البيانات لسه تتجهّز. افتح التبويب بعد ما يخلص التركيب.",
				en: "The database is still being set up. Come back once the install finishes.",
			},
		},
		{
			layout: BridgeLayout.Actions,
			id: "import",
			title: {
				ar: "استيراد SQL",
				en: "Import SQL",
			},
			help: {
				ar: "ارفع ملف .sql من مدير الملفات واكتب مساره هنا عشان ننفّذه على قاعدة بياناتك.",
				en: "Upload a .sql file with the file manager, then name its path here and we run it against your database.",
			},
			module: "databaseTools",
			actions: [
				{
					id: "importSql",
					label: {
						ar: "نفّذ ملف SQL",
						en: "Run a SQL file",
					},
					confirm: BridgeConfirm.Normal,
					confirmText: {
						ar: "ننفّذ الملف على قاعدة بياناتك. إذا كان الملف يعدّل جداول موجودة، بياناتها تتغيّر.",
						en: "We run the file against your database. If it changes tables you already have, their data changes with them.",
					},
					fields: [
						{
							key: "path",
							control: BridgeControl.Text,
							label: {
								ar: "مسار الملف",
								en: "File path",
							},
							help: {
								ar: "المسار من جذر سيرفرك، مثال: server-data/esx.sql",
								en: "The path from your server's root, for example server-data/esx.sql",
							},
							placeholder: "server-data/esx.sql",
							maxLength: 200,
						},
					],
				},
			],
		},
	],
};

const controlsTab: Bridge.Tab = {
	id: "controls",
	title: {
		ar: "التحكم",
		en: "Controls",
	},
	icon: BridgeIcon.Command,
	sections: [
		{
			layout: BridgeLayout.Actions,
			id: "live",
			title: {
				ar: "أوامر سريعة",
				en: "Quick actions",
			},
			help: {
				ar: "تشتغل على طول على سيرفرك الشغّال.",
				en: "These run on your server right away.",
			},
			module: "live",
			actions: [
				{
					id: "announce",
					label: {
						ar: "رسالة للاعبين",
						en: "Announce",
					},
					fields: [
						{
							key: "message",
							control: BridgeControl.Text,
							label: {
								ar: "الرسالة",
								en: "Message",
							},
							help: {
								ar: "توصل لكل اللي داخلين الحين في الشات.",
								en: "Reaches everyone on the server right now, in chat.",
							},
							maxLength: ANNOUNCE_MESSAGE_LENGTH,
						},
					],
				},
				{
					id: "restartResource",
					label: {
						ar: "أعد تشغيل ريسورس",
						en: "Restart a resource",
					},
					fields: [
						{
							key: "resource",
							control: BridgeControl.Text,
							label: {
								ar: "اسم الريسورس",
								en: "Resource name",
							},
							help: {
								ar: "نفس اسم المجلد داخل server-data/resources.",
								en: "The folder name inside server-data/resources.",
							},
							placeholder: "es_extended",
							maxLength: 64,
						},
					],
				},
				{
					id: "refresh",
					label: {
						ar: "أعد قراءة الريسورسات",
						en: "Refresh resources",
					},
				},
			],
		},
	],
};

export const panel: Bridge.Panel = {
	tabs: [
		licenseTab,
		settingsTab,
		playersTab,
		databaseTab,
		controlsTab,
	],
};
