FROM keymetrics/pm2:latest-alpine

# Bundle APP files
COPY . .

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install --production
RUN pm2 install pm2-auto-pull
RUN pm2 install pm2-server-monit

# Show current folder structure in logs
RUN ls -al -R

CMD [ "pm2-runtime", "start", "pm2.json" ]