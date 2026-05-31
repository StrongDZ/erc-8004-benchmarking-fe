#!/bin/sh
set -e

# Sync node_modules with current package-lock.json on every container start.
# This means `docker compose up --build` is enough after adding/removing packages —
# no need for `docker compose down -v`.
npm install --prefer-offline

exec "$@"
