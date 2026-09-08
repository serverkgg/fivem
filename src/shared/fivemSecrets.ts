import { generateToken } from "@serverkgg/bridge/utils";

const DATABASE_PASSWORD_LENGTH = 28;

const PLAYERS_TOKEN_LENGTH = 40;

const PANEL_PASSWORD_LENGTH = 20;

const BCRYPT_COST = 11;

export const generateDatabasePassword = () => {
	return generateToken(DATABASE_PASSWORD_LENGTH);
};

export const generatePlayersToken = () => {
	return generateToken(PLAYERS_TOKEN_LENGTH);
};

export const generatePanelPassword = () => {
	return generateToken(PANEL_PASSWORD_LENGTH);
};

export const hashPassword = async (password: string) => {
	return await Bun.password.hash(password, {
		algorithm: "bcrypt",
		cost: BCRYPT_COST,
	});
};
