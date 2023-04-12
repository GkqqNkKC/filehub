#!/bin/bash

close_existing_session() {
  session_name=$1
  existing_session=$(screen -ls | grep -w "${session_name}")

  if [ -n "$existing_session" ]; then
    echo "Closing existing screen session: ${session_name}"
    screen -S "${session_name}" -X quit
  fi
}

close_existing_session "db"
close_existing_session "server"