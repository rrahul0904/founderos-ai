#!/usr/bin/env sh
set -eu
[ -f .env.local ] || cp .env.example .env.local
npm install
printf '\nFounderOS ready. Run: npm run dev\n'
