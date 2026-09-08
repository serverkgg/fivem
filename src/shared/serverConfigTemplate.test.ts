import { describe, expect, test } from "bun:test";
import { readDirective } from "./serverConfig";
import { serverConfigTemplate } from "./serverConfigTemplate";

describe("serverConfigTemplate", () => {
	test("ships rcon closed, on a line the driver rewrites from the remote access toggle", () => {
		const template = serverConfigTemplate(30_120, "سيرفر test");

		expect(readDirective(template, "set rcon_password")).toBe("");
		expect(template).not.toContain("#set rcon_password");
	});

	test("binds both endpoints to the port the platform gave the server", () => {
		const template = serverConfigTemplate(30_140, "سيرفر test");

		expect(readDirective(template, "endpoint_add_tcp")).toBe("0.0.0.0:30140");
		expect(readDirective(template, "endpoint_add_udp")).toBe("0.0.0.0:30140");
	});
});
