#!/bin/bash
cd $(dirname "${BASH_SOURCE[0]}")/.. &&
./scripts/stop_backend.sh &&
sudo chmod 777 /run/screen &&

# start database
# screen -S db -d -m &&
# screen -S db -X stuff "sqlite3 db/db.db\n" &&

# start server
screen -S server -d -m &&
screen -S server -X stuff "cd server_src\nnode server.js\n" &&

screen -ls