#!/usr/bin/sh
cd ~/SimpleYTHelper/
pm2 resurrect
git checkout master
git pull
npm install
pm2 restart 0
