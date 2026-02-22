#!/bin/zsh
set -euo pipefail

APP_DIR="/Users/joowon/Documents/New project/inventory-app"

cd "$APP_DIR"
npm run build:web
exec node web-server.js
