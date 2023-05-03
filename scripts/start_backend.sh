#!/bin/bash

# close previous sessions
cd .. &&
./scripts/stop_backend.sh &&

# screen fix
sudo chmod 777 /run/screen &&

# start server
screen -S server -d -m &&
screen -S server -X stuff "cd server_src\nnode server.js\n" &&

screen -ls