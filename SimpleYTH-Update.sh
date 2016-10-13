#!/bin/bash
MY_PATH="`dirname \"$0\"`"
cd $MY_PATH
git add .
git stash
git stash clear
git reset --hard
git pull --force
