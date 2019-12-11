FROM keymetrics/pm2:latest-alpine

# Install app dependencies
RUN apt-get update && apt-get install -y git
RUN git pull https://github.com/Istani/SimpleYTHelper.git

RUN cd SimpleYTHelper
RUN git checkout rewrite_node

COPY .env SimpleYTHelper/.env
RUN npm install 
RUN pm2 install pm2-server-monit

CMD [ "pm2-runtime", "start", "ecosystem.local.config.js" ]