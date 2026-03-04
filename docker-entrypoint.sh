#!/bin/sh

# Start json-server API on port 3001
json-server db.json -p 3001 -H 0.0.0.0 &

# Serve the React build on port 3000
serve -s build -l 3000

