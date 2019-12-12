FROM ubuntu:18.04

# Install app dependencies
RUN apt-get update
RUN apt-get install -y git
RUN apt-get install -y nodejs

RUN npm install -g pm2
RUN git clone https://github.com/Istani/SimpleYTHelper.git

RUN cd SimpleYTHelper && git checkout rewrite_node && npm install 
COPY .env SimpleYTHelper/.env

RUN pm2 start SimpleYTHelper/ecosystem.local.config.js
CMD /bin/sh