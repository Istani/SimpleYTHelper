git pull
knex migrate:latest
pm2 startOrReload ecosystem.config.js
pm2 save