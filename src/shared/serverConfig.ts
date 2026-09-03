export interface ConfigDirective {
	command: string;
	value: string;
	quote: boolean;
}

const COMMENT = /^\s*(?:#|\/\/)/;

export const tokenizeConfigLine = (line: string): string[] => {
	const tokens: string[] = [];

	let current = "";
	let quoted = false;
	let started = false;

	for (const character of line) {
		if (character === '"') {
			quoted = !quoted;
			started = true;

			continue;
		}

		if (!quoted && /\s/.test(character)) {
			if (started || current.length > 0) {
				tokens.push(current);

				current = "";
				started = false;
			}

			continue;
		}

		current += character;
	}

	if (started || current.length > 0) {
		tokens.push(current);
	}

	return tokens;
};

export const isConfigComment = (line: string) => {
	return COMMENT.test(line) || line.trim().length === 0;
};

const matchesCommand = (tokens: string[], command: string) => {
	const parts = command.split(" ");

	return tokens.length >= parts.length && parts.every((part, index) => tokens[index] === part);
};

const isPrintable = (character: string) => {
	const code = character.codePointAt(0) ?? 0;

	return code >= 0x20 && code !== 0x7f;
};

export const sanitizeConfigValue = (value: string) => {
	return [
		...value,
	]
		.map((character) => (isPrintable(character) ? character : " "))
		.join("")
		.replaceAll('"', "")
		.trim();
};

export const formatDirective = (directive: ConfigDirective) => {
	const value = sanitizeConfigValue(directive.value);

	if (directive.quote) {
		return `${directive.command} "${value}"`;
	}

	return value.length === 0 ? directive.command : `${directive.command} ${value}`;
};

export const readDirective = (content: string, command: string): string | null => {
	const parts = command.split(" ");

	for (const line of content.split("\n")) {
		if (isConfigComment(line)) {
			continue;
		}

		const tokens = tokenizeConfigLine(line);

		if (matchesCommand(tokens, command)) {
			return tokens.slice(parts.length).join(" ");
		}
	}

	return null;
};

export const writeDirectives = (content: string, directives: ConfigDirective[]): string => {
	const trailing = content.endsWith("\n");
	const source = trailing ? content.slice(0, -1) : content;
	const written = new Set<string>();
	const lines: string[] = [];

	for (const line of source.split("\n")) {
		if (isConfigComment(line)) {
			lines.push(line);

			continue;
		}

		const tokens = tokenizeConfigLine(line);
		const directive = directives.find((candidate) => matchesCommand(tokens, candidate.command));

		if (!directive) {
			lines.push(line);

			continue;
		}

		if (written.has(directive.command)) {
			continue;
		}

		written.add(directive.command);
		lines.push(formatDirective(directive));
	}

	const missing = directives.filter((directive) => !written.has(directive.command));

	if (missing.length > 0) {
		while (lines.at(-1)?.trim().length === 0) {
			lines.pop();
		}

		lines.push("", "# added by serverk", ...missing.map(formatDirective));
	}

	const body = lines.join("\n");

	return trailing || missing.length > 0 ? `${body}\n` : body;
};
