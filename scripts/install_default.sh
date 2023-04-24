#!/bin/bash
apt install -y npm scss &&

# server_src related
cd $(dirname "${BASH_SOURCE[0]}")/../server_src &&
npm install express.js sqlite3@5.0.0 cors &&

echo "- done. if needed and compatible, go ahead and run install_sqlite_ubuntu.sh"