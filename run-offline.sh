#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
API_DIR="$ROOT_DIR/backend/KidsArea.Api"
WEB_DIR="$API_DIR/wwwroot"

echo "Building frontend..."
cd "$FRONTEND_DIR"
npm install
npm run build

echo "Preparing local web app..."
mkdir -p "$WEB_DIR"
find "$WEB_DIR" -mindepth 1 -maxdepth 1 ! -name uploads -exec rm -rf {} +
cp -R dist/. "$WEB_DIR/"

echo "Starting Kids Area offline at http://localhost:5000"
cd "$API_DIR"
dotnet restore
dotnet run