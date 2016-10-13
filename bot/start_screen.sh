#!/bin/bash
MY_PATH="`dirname \"$0\"`"
cd $MY_PATH
screen -S DiscordBot -X start_bot.sh
