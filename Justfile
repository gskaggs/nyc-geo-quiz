# NYC Geo Quiz

port := "8642"

# List available recipes
default:
    @just --list

# Serve the app at http://localhost:{{port}}/
run:
    python3 -m http.server {{port}}

# Serve the app and open it in the browser
open:
    (sleep 1 && open http://localhost:{{port}}/) &
    python3 -m http.server {{port}}

# Open the verification report
report:
    open report/report.html
