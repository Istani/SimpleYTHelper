#!/bin/bash

cd /var/www/html/SimpleYTH
mysqldump --database simpleyth --user simpleyth --password=geheim > backup/tmp.sql

tar -czf /var/www/backup/simpleyth_mysql.tar.gz ./backup/

