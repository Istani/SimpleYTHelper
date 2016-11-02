#!/bin/bash
MY_PATH="/var/www/html/SimpleYTH/bot"
cd $MY_PATH
screen -S DiscordBot -X start_bot.sh
