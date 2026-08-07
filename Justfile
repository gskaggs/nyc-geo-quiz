# NYC Geo Quiz

port := "8642"

# List available recipes
default:
    @just --list

# Serve the app at http://localhost:{{port}}/
run:
    #!/usr/bin/env bash
    set -euo pipefail
    pid=$(lsof -ti :{{port}} 2>/dev/null || true)
    if [[ -n "$pid" ]]; then
        echo "Port {{port}} is in use by PID $pid"
        read -p "Kill it? [y/N] " answer
        if [[ "$answer" =~ ^[Yy]$ ]]; then
            kill "$pid"
            sleep 0.5
        else
            echo "Aborted."
            exit 1
        fi
    fi
    echo "Serving at http://localhost:{{port}}/"
    python3 -m http.server {{port}}

# Serve the app and open it in the browser
open:
    (sleep 1 && open http://localhost:{{port}}/) &
    just run
