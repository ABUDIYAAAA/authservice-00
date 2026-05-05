#!/bin/bash

# Kill any existing processes on exit
trap 'kill $(jobs -p)' EXIT

# Start server
./tmp/server &
SERVER_PID=$!

# Start worker
./tmp/worker &
WORKER_PID=$!

# Wait for both
wait $SERVER_PID $WORKER_PID
