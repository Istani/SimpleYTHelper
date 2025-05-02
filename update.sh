#!/usr/bin/sh
cd ~/SimpleYTHelper/
rm */core
pm2 resurrect
git checkout master
git pull
npm install
pm2 restart 1
