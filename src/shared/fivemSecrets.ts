const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const DATABASE_PASSWORD_LENGTH = 28;

const PLAYERS_TOKEN_LENGTH = 40;

const PANEL_PASSWORD_LENGTH = 20;

const BCRYPT_COST = 11;

export const generateToken = (length: number) => {
	const bytes = new Uint8Array(length);

	crypto.getRandomValues(bytes);

	return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length] ?? "x").join("");
};

export const generateDatabasePassword = () => {
	return generateToken(DATABASE_PASSWORD_LENGTH);
};

export const generatePlayersToken = () => {
	return generateToken(PLAYERS_TOKEN_LENGTH);
};

export const generatePanelPassword = () => {
	return generateToken(PANEL_PASSWORD_LENGTH);
};

// txAdmin reads TXHOST_DEFAULT_ACCOUNT's third field as a bcrypt hash and
// refuses to boot on anything its /^\$2[aby]\$[0-9]{2}\$[A-Za-z0-9./]{53}$/
// does not match, which is exactly what Bun's bcrypt produces.
export const hashPassword = async (password: string) => {
	return await Bun.password.hash(password, {
		algorithm: "bcrypt",
		cost: BCRYPT_COST,
	});
};
