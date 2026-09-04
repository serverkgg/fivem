import { type Bridge, BridgeKind, BridgeSetupStepKind } from "@serverkgg/bridge";
import { GuideOpenTab } from "@serverkgg/bridge/guides";
import { LICENSE_VARIABLE } from "../shared";
import { checkLicence, RETRY_ACTION, unknownSetupAction, unknownSetupStep, VERIFY_STEP } from "./setupFlow";

export const LICENSE_TAB = "license";

export const LICENSE_SECTION = "license";

export const SETTINGS_TAB = "settings";

export const SERVER_SECTION = "server";

export const LICENSE_STEP = "license";

export const TXADMIN_STEP = "txadmin";

export const NAME_STEP = "name";

export const INVITE_STEP = "invite";

export const setup: Bridge.Setup = {
	kind: BridgeKind.Setup,
	steps: [
		{
			kind: BridgeSetupStepKind.Form,
			id: LICENSE_STEP,
			required: true,
			tab: LICENSE_TAB,
			section: LICENSE_SECTION,
			fields: [
				LICENSE_VARIABLE,
			],
			title: {
				ar: "الصق مفتاح الترخيص",
				en: "Paste your licence key",
			},
			help: {
				ar: "فايف إم ما يشتغل بدون مفتاح من portal.cfx.re باسمك أنت. سوّ مفتاح جديد من Servers ← Registration Keys والصقه هنا. المفتاح سر، ما نعرضه لأحد غيرك.",
				en: "FiveM will not run without a key from portal.cfx.re in your own name. Generate one under Servers → Registration Keys and paste it here. The key is a secret; nobody but you sees it.",
			},
		},
		{
			kind: BridgeSetupStepKind.Driver,
			id: VERIFY_STEP,
			required: true,
			requiresRunning: true,
			title: {
				ar: "نتأكد من الترخيص",
				en: "Check the licence",
			},
			help: {
				ar: "نشغّل سيرفرك ونراقب الكونسول لين Cfx.re يقبل المفتاح. لو رفضه، ارجع للخطوة اللي قبل وغيّر المفتاح.",
				en: "We start your server and watch the console until Cfx.re accepts the key. If it is refused, go back a step and change the key.",
			},
		},
		{
			kind: BridgeSetupStepKind.Open,
			id: TXADMIN_STEP,
			required: false,
			target: {
				tab: GuideOpenTab.Panel,
				tabId: LICENSE_TAB,
			},
			title: {
				ar: "خذ بيانات txAdmin",
				en: "Grab your txAdmin login",
			},
			help: {
				ar: "لوحة txAdmin شغّالة داخل سيرفرك. المستخدم وكلمة المرور في تبويب الترخيص، والعنوان في صفحة السيرفر.",
				en: "The txAdmin panel runs inside your server. The username and password are in the Licence tab, the address on your server page.",
			},
		},
		{
			kind: BridgeSetupStepKind.Form,
			id: NAME_STEP,
			required: false,
			tab: SETTINGS_TAB,
			section: SERVER_SECTION,
			fields: [
				"sv_hostname",
				"sv_projectName",
				"sv_maxclients",
			],
			title: {
				ar: "سمِّ سيرفرك",
				en: "Name your server",
			},
			help: {
				ar: "الاسم اللي يطلع في قائمة السيرفرات، اسم المشروع على cfx.re، وعدد اللاعبين. تقدر تتخطاها وتعدّلها بعدين من الإعدادات.",
				en: "The name in the server browser, the project name on cfx.re, and the player slots. Skip it and change it later from Settings.",
			},
		},
		{
			kind: BridgeSetupStepKind.Open,
			id: INVITE_STEP,
			required: false,
			target: {
				tab: GuideOpenTab.Access,
			},
			title: {
				ar: "عزّم أصحابك",
				en: "Invite your friends",
			},
			help: {
				ar: "انسخ عنوان سيرفرك وأرسله لأصحابك. يكتبون connect والعنوان في كونسول F8.",
				en: "Copy your server address and send it to your friends. They type connect and the address in the F8 console.",
			},
		},
	],

	async submit(context, step, action) {
		if (step !== VERIFY_STEP) {
			throw unknownSetupStep();
		}

		if (action !== RETRY_ACTION) {
			throw unknownSetupAction();
		}

		await checkLicence(context);
	},
};
