import type { Bridge } from "@serverkgg/bridge";
import { PANEL_RESOURCE, PANEL_RESOURCE_DIRECTORY } from "../shared";

const MANIFEST = `fx_version 'cerulean'
game 'gta5'

name '${PANEL_RESOURCE}'
description 'Serverk panel bridge — console commands the panel drives'
author 'Serverk'
version '1.0.0'

server_script 'sv_serverk.lua'
`;

// clientkick and status used to come from rconlog, which cfx-server-data
// dropped on 2026-07-20, so the panel ships the one command it needs.
const SCRIPT = `local DEFAULT_REASON = 'You were removed by an admin.'

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
end, true)
`;

export const seedPanelResource = async (context: Bridge.Context) => {
	await context.files.ensure(PANEL_RESOURCE_DIRECTORY);
	await context.files.write(`${PANEL_RESOURCE_DIRECTORY}/fxmanifest.lua`, MANIFEST);
	await context.files.write(`${PANEL_RESOURCE_DIRECTORY}/sv_serverk.lua`, SCRIPT);
};
