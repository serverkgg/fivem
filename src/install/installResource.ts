import type { Bridge } from "@serverkgg/bridge";
import { execDetail } from "@serverkgg/bridge/utils";
import { CONTROL_TOKEN_CONVAR, type FivemServerPaths, PANEL_RESOURCE, RUNTIME_DIRECTORY } from "../shared";

const MANIFEST = `fx_version 'cerulean'
game 'gta5'

name '${PANEL_RESOURCE}'
description 'Serverk panel bridge — console commands the panel drives'
author 'Serverk'
version '2.0.0'

server_script 'sv_serverk.lua'
`;

// txAdmin owns the FXServer process and reads no stdin of its own, so the panel
// console reaches the game through this endpoint instead. It listens on the
// game port under /serverk/ and answers only to the token serverk writes into
// server.cfg on every install.
const SCRIPT = `local DEFAULT_REASON = 'You were removed by an admin.'

local function controlToken()
	return GetConvar('${CONTROL_TOKEN_CONVAR}', '')
end

local function authorized(request)
	local expected = controlToken()

	if expected == '' then
		return false
	end

	local offered = request.headers['X-Serverk-Token'] or request.headers['x-serverk-token']

	return offered == expected
end

RegisterCommand('serverk_kick', function(source, args)
	if source ~= 0 then
		return
	end

	local target = tonumber(args[1])

	if not target then
		print('serverk: usage is serverk_kick <id> [reason]')
		return
	end

	if GetPlayerName(target) == nil then
		print('serverk: no player is connected with id ' .. tostring(target))
		return
	end

	local reason = table.concat(args, ' ', 2)

	if reason == '' then
		reason = DEFAULT_REASON
	end

	DropPlayer(target, reason)
end, false)

SetHttpHandler(function(request, response)
	local function reply(status, body)
		response.writeHead(status, { ['Content-Type'] = 'text/plain; charset=utf-8' })
		response.send(body)
	end

	if request.method ~= 'POST' then
		reply(405, 'method not allowed')
		return
	end

	if not authorized(request) then
		reply(403, 'forbidden')
		return
	end

	if request.path ~= '/command' then
		reply(404, 'not found')
		return
	end

	request.setDataHandler(function(body)
		local command = body:gsub('[\\r\\n]+', ' '):gsub('^%s+', ''):gsub('%s+$', '')

		if command == '' then
			reply(400, 'empty command')
			return
		end

		ExecuteCommand(command)
		reply(200, 'ok')
	end)
end)
`;

export const seedPanelResource = async (context: Bridge.Context, paths: FivemServerPaths) => {
	await context.files.ensure(paths.panelResource);
	await context.files.write(`${paths.panelResource}/fxmanifest.lua`, MANIFEST);
	await context.files.write(`${paths.panelResource}/sv_serverk.lua`, SCRIPT);
};

const SYSTEM_CHAT = `${RUNTIME_DIRECTORY}/opt/cfx-server/citizen/system_resources/chat`;

const CHAT_GROUP = "[gameplay]";

// cfx-server-data deleted [gameplay]/chat on 2026-07-20, and the copy the
// artifact carries under citizen/system_resources is scanned but never
// startable by name — a server that ensures it only prints "Couldn't find
// resource chat", which leaves players with no chat and no `say` command. The
// artifact's copy is the right one for the build, so it is placed where the
// server can actually start it.
export const seedChatResource = async (context: Bridge.Context, paths: FivemServerPaths) => {
	const group = `${paths.resources}/${CHAT_GROUP}`;
	const target = `${group}/chat`;

	if (await context.files.exists(target)) {
		return;
	}

	if (!(await context.files.exists(SYSTEM_CHAT))) {
		context.log.warn("this fivem build ships no chat resource to seed");

		return;
	}

	await context.files.ensure(group);

	const result = await context.exec([
		"cp",
		"-r",
		SYSTEM_CHAT,
		`${group}/`,
	]);

	if (result.code !== 0) {
		throw new Error(`seeding the chat resource failed with code ${result.code} — ${execDetail(result)}`);
	}

	context.log("chat resource seeded from the artifact");
};
