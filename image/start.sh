#!/usr/bin/env bash

# Starts MariaDB in the background, then FXServer in the foreground with no
# +exec argument, which is what makes it boot txAdmin instead of the game
# server directly (code/server/launcher/src/Server.cpp). txAdmin is configured
# entirely through the TXHOST_* variables serverk writes beside this volume.
#
# txAdmin never reads its own stdin, so the console lines the panel writes are
# forwarded into the game server over the [serverk] resource's HTTP endpoint.
# MariaDB is shut down cleanly once FXServer exits, whichever way it exited.

set -uo pipefail

ROOT="/home/container"
DATABASE_DIR="${ROOT}/.mariadb"
RUN_SCRIPT="${ROOT}/run.sh"
ENVIRONMENT_FILE="${ROOT}/.serverk-txhost.env"
PID_FILE="${ROOT}/.serverk-run.pid"
SOCKET="${DATABASE_DIR}/mysql.sock"
INIT_FILE="${DATABASE_DIR}/serverk-init.sql"

if [ ! -f "${RUN_SCRIPT}" ]; then
	echo "serverk: ${RUN_SCRIPT} is missing — the fivem artifact was not installed" >&2
	exit 66
fi

if [ ! -f "${ENVIRONMENT_FILE}" ]; then
	echo "serverk: ${ENVIRONMENT_FILE} is missing — the install did not finish" >&2
	exit 66
fi

set -a
# shellcheck disable=SC1090
. "${ENVIRONMENT_FILE}"
set +a

GAME_PORT="${TXHOST_FXS_PORT:-30120}"
TXADMIN_PORT="${TXHOST_TXA_PORT:-40120}"

echo "$$" > "${PID_FILE}"

mkdir -p "${DATABASE_DIR}/tmp"

database_args=(
	--no-defaults
	--basedir=/usr
	--datadir="${DATABASE_DIR}"
	--socket="${SOCKET}"
	--port=3306
	--bind-address=127.0.0.1
	--skip-networking=0
	--pid-file="${DATABASE_DIR}/mariadb.pid"
	--tmpdir="${DATABASE_DIR}/tmp"
	--lc-messages-dir=/usr/share/mysql
	--skip-name-resolve
)

if [ -f "${INIT_FILE}" ]; then
	database_args+=(--init-file="${INIT_FILE}")
fi

rm -f "${SOCKET}"

echo "serverk: starting mariadb on 127.0.0.1:3306"

/usr/sbin/mariadbd "${database_args[@]}" &
DATABASE_PID=$!

for _ in $(seq 1 120); do
	if [ -S "${SOCKET}" ]; then
		break
	fi

	if ! kill -0 "${DATABASE_PID}" 2>/dev/null; then
		break
	fi

	sleep 0.5
done

if [ -S "${SOCKET}" ]; then
	echo "serverk: mariadb is ready"
else
	echo "serverk: mariadb did not come up — starting fxserver without a database" >&2
fi

stop_database() {
	if kill -0 "${DATABASE_PID}" 2>/dev/null; then
		echo "serverk: shutting mariadb down"
		kill -TERM "${DATABASE_PID}" 2>/dev/null
		wait "${DATABASE_PID}" 2>/dev/null
	fi
}

if ! cd "${ROOT}"; then
	echo "serverk: ${ROOT} is missing" >&2
	stop_database
	exit 66
fi

echo "serverk: starting txadmin on ${TXADMIN_PORT} and fxserver on ${GAME_PORT}"

bash "${RUN_SCRIPT}" < /dev/null &
SERVER_PID=$!

# The panel console writes to this script's stdin. Nothing downstream reads it,
# so each line is handed to the game server through the [serverk] resource.
console_bridge() {
	local line

	while IFS= read -r line; do
		line="${line%$'\r'}"

		if [ -z "${line}" ]; then
			continue
		fi

		if ! curl --silent --show-error --max-time 10 --output /dev/null \
			--request POST \
			--header "X-Serverk-Token: ${SERVERK_CONTROL_TOKEN:-}" \
			--header "Content-Type: text/plain" \
			--data-binary "${line}" \
			"http://127.0.0.1:${GAME_PORT}/serverk/command"; then
			echo "serverk: the server did not take the console command" >&2
		fi
	done
}

# A background job in a non-interactive shell gets /dev/null on stdin unless it
# is redirected explicitly, which would end the loop before it read a line.
console_bridge <&0 &
CONSOLE_PID=$!

forward() {
	kill -TERM "${SERVER_PID}" 2>/dev/null
}

trap forward TERM INT

wait "${SERVER_PID}"
STATUS=$?

while kill -0 "${SERVER_PID}" 2>/dev/null; do
	wait "${SERVER_PID}"
	STATUS=$?
done

kill -TERM "${CONSOLE_PID}" 2>/dev/null

stop_database

rm -f "${PID_FILE}"

exit "${STATUS}"
