#!/bin/bash
MY_PATH="/var/www/html/SimpleYTH"
cd $MY_PATH
git add .
git stash
git stash clear
git reset --hard
git pull --force
