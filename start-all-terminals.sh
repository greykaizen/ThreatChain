#!/bin/bash

# ============================================================
#  ThreatChain - Start All Services
#  Opens 3 separate terminals:
#    Terminal 1 → Frontend  (Next.js  on port 3000)
#    Terminal 2 → Backend   (Node.js  on port 3001)
#    Terminal 3 → ML Service(Python   on port 5001)
# ============================================================

# Resolve project root (directory of this script)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║     🔗 ThreatChain — Starting All Services   ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "📁 Project directory: $PROJECT_DIR"
echo ""

# ── Helper: detect which terminal emulator is available ─────
open_terminal() {
    local TITLE="$1"
    local CMD="$2"

    if command -v gnome-terminal &>/dev/null; then
        gnome-terminal --title="$TITLE" -- bash -c "$CMD; exec bash" &

    elif command -v xterm &>/dev/null; then
        xterm -title "$TITLE" -e bash -c "$CMD; exec bash" &

    elif command -v konsole &>/dev/null; then
        konsole --new-tab -p tabtitle="$TITLE" -e bash -c "$CMD; exec bash" &

    elif command -v xfce4-terminal &>/dev/null; then
        xfce4-terminal --title="$TITLE" --command="bash -c '$CMD; exec bash'" &

    elif command -v tilix &>/dev/null; then
        tilix --title="$TITLE" -e bash -c "$CMD; exec bash" &

    elif command -v alacritty &>/dev/null; then
        alacritty --title "$TITLE" -e bash -c "$CMD; exec bash" &

    elif command -v lxterminal &>/dev/null; then
        lxterminal --title="$TITLE" -e bash -c "$CMD; exec bash" &

    else
        echo "❌ No supported terminal emulator found!"
        echo "   Supported: gnome-terminal, xterm, konsole, xfce4-terminal, tilix, alacritty, lxterminal"
        echo "   Install one with: sudo apt install gnome-terminal"
        exit 1
    fi
}

# ── Terminal 1: Frontend ─────────────────────────────────────
echo "🎨 [1/3] Launching Frontend terminal (port 3000)..."
open_terminal "ThreatChain — Frontend" \
    "cd '$PROJECT_DIR' && echo '' && echo '🎨 ThreatChain Frontend (Next.js)' && echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' && echo '🌐 URL: http://localhost:3000' && echo '' && npm run frontend"

sleep 1

# ── Terminal 2: Backend ──────────────────────────────────────
echo "⚙️  [2/3] Launching Backend terminal (port 3001)..."
open_terminal "ThreatChain — Backend" \
    "cd '$PROJECT_DIR' && echo '' && echo '⚙️  ThreatChain Backend (Node/Express)' && echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' && echo '🔗 API: http://localhost:3001' && echo '' && npm run backend:dev"

sleep 1

# ── Terminal 3: ML Service ───────────────────────────────────
echo "🤖 [3/3] Launching ML Service terminal (port 5001)..."
open_terminal "ThreatChain — ML Service" \
    "cd '$PROJECT_DIR' && echo '' && echo '🤖 ThreatChain ML Service (Python/Flask)' && echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' && echo '📡 API: http://localhost:5001' && echo '' && bash start-ml-service.sh"

echo ""
echo "✅ All 3 terminals launched!"
echo ""
echo "┌─────────────────────────────────────────────┐"
echo "│  SERVICE        │  URL                      │"
echo "├─────────────────────────────────────────────┤"
echo "│  🎨 Frontend    │  http://localhost:3000     │"
echo "│  ⚙️  Backend     │  http://localhost:3001     │"
echo "│  🤖 ML Service  │  http://localhost:5001     │"
echo "└─────────────────────────────────────────────┘"
echo ""
echo "💡 Press Ctrl+C in each terminal to stop that service."
echo ""
