#!/usr/bin/env sh

pm2-runtime /app/ecosystem.local.config.js

# docker run -it -P --name SYTH -v /y/SimpleSoftwareStudioShare/SimpleYTH/:/app node
# child_process.execSync("ls /").toString();