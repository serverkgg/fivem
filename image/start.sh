#!/usr/bin/env bash

# Starts MariaDB in the background, then FXServer in the foreground with its
# stdin attached so the panel console can talk to it. MariaDB is shut down
# cleanly once FXServer exits, whichever way it exited.

set -uo pipefail

if [ "$#" -lt 1 ]; then
	echo "serverk: start.sh needs the game port" >&2
	exit 64
fi

GAME_PORT="$1"

ROOT="/home/container"
DATABASE_DIR="${ROOT}/.mariadb"
SERVER_DATA_DIR="${ROOT}/server-data"
RUN_SCRIPT="${ROOT}/run.sh"
SOCKET="${DATABASE_DIR}/mysql.sock"
INIT_FILE="${DATABASE_DIR}/serverk-init.sql"

if [ ! -f "${RUN_SCRIPT}" ]; then
	echo "serverk: ${RUN_SCRIPT} is missing — the fivem artifact was not installed" >&2
	exit 66
fi

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

if ! cd "${SERVER_DATA_DIR}"; then
	echo "serverk: ${SERVER_DATA_DIR} is missing" >&2
	stop_database
	exit 66
fi

echo "serverk: starting fxserver on ${GAME_PORT}"

bash "${RUN_SCRIPT}" +exec server.cfg <&0 &
SERVER_PID=$!

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

stop_database

exit "${STATUS}"
