const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const DATABASE_PASSWORD_LENGTH = 28;

const PLAYERS_TOKEN_LENGTH = 40;

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
