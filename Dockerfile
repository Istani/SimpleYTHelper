FROM ubuntu:18.04

# Install app dependencies
RUN apt-get update
RUN apt-get install -y git
RUN apt-get install -y nodejs

RUN git clone https://github.com/Istani/SimpleYTHelper.git

RUN cd SimpleYTHelper && git checkout rewrite_node
COPY .env SimpleYTHelper/.env

RUN npm install -g pm2
RUN npm install 

RUN pm2 start SimpleYTHelper/ecosystem.local.config.js
CMD /bin/sh