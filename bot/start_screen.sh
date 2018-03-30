#!/bin/bash

BOT_DIR=/var/www/html/SimpleYTH/bot

function start_bot() {
  echo "starting SimpleYTH Bot"
  screen -S SimpleYTHBot -p SimpleYTHBot -X stuff "cd $BOT_DIR; sh ./start_bot.sh\n"
  echo "starting SimpleYTH Bot"
  screen -S HumbleScan -p HumbleScan -X stuff "cd $BOT_DIR; sh ./start_humble.sh\n"
}

screen -list | grep SimpleYTHBot > /dev/null
sr=$?
if [[ $sr == 0 ]]; then
  echo "screen is running"

  #Check if there is a "SimpleYTHBot" screen window
  screen -Q windows|grep SimpleYTHBot > /dev/null
  bot=$?
  if [[ $bot == 1 ]]; then
    screen -S SimpleYTHBot -X screen -t SimpleYTHBot bash
    screen -S HumbleScan -X screen -t HumbleScan bash
    start_bot
  fi
else
  echo "screen is not yet running"
  screen -AdmS SimpleYTHBot -t SimpleYTHBot bash
  screen -AdmS HumbleScan -t HumbleScan bash
  start_bot
fi
