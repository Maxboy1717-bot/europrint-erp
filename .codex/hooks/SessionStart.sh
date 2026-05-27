#!/bin/bash
# EuroPrint ERP — Sessiya boshlanganda kontekst yuklash
# Output stdout → Claude Code'ga "additionalContext" sifatida injected.

set -uo pipefail

echo "🏭 EuroPrint ERP — Claude Code Sessiyasi"
echo "========================================="

# Loyiha versiyasi
if [ -f "package.json" ]; then
  VERSION=$(grep '"version"' package.json | head -1 | grep -oE '"[0-9.]+"' | tr -d '"')
  [ -n "$VERSION" ] && echo "📦 Versiya: $VERSION"
fi

# Git holati
if command -v git >/dev/null 2>&1 && git rev-parse --git-dir >/dev/null 2>&1; then
  BRANCH=$(git branch --show-current 2>/dev/null)
  CHANGES=$(git status --short 2>/dev/null | wc -l | tr -d ' ')
  LAST_COMMIT=$(git log -1 --format='%h %s' 2>/dev/null | head -c 80)
  [ -n "$BRANCH" ] && echo "🌿 Branch: $BRANCH"
  [ "$CHANGES" -gt 0 ] && echo "📝 O'zgartirilgan fayllar: $CHANGES"
  [ -n "$LAST_COMMIT" ] && echo "📜 Oxirgi commit: $LAST_COMMIT"
fi

# Arxitektura rules holati (oxirgi run hisoboti)
if [ -f "scripts/reviewer-report.txt" ]; then
  LAST_RUN=$(stat -c '%y' scripts/reviewer-report.txt 2>/dev/null | cut -d'.' -f1)
  [ -n "$LAST_RUN" ] && echo "📊 Oxirgi reviewer run: $LAST_RUN"
fi

# Bugungi sana
echo "📅 Sana: $(date '+%d.%m.%Y %H:%M')"
echo ""

# Muhim eslatmalar (har sessiya boshida)
echo "💡 Eslatmalar:"
echo "   • DB o'zgarishidan oldin: pnpm --filter @workspace/db drizzle-kit generate"
echo "   • Merge oldidan: bash scripts/run-all-reviewers.sh"
echo "   • Test: npx jest --config apps/api/test/jest.config.js"
echo "   • Soft delete majburiy — hard delete YO'Q"
echo "   • process.env to'g'ridan ishlatma — ConfigService"
echo "========================================="
