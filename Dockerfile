FROM ubuntu

# Install app dependencies
RUN apt-get update
RUN apt-get install -y git
RUN apt-get install -y npm

RUN npm install -g pm2

#RUN git clone https://github.com/Istani/SimpleYTHelper.git
#RUN cd SimpleYTHelper && git checkout rewrite_node && npm install 
#COPY .env SimpleYTHelper/.env

COPY . SimpleYTHelper

RUN pm2 start SimpleYTHelper/ecosystem.local.config.js
CMD /bin/sh