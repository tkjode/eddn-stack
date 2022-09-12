FROM node:18.9-slim

WORKDIR /app

COPY ../src/zeromq-subscriber/package*.json ./
COPY ../src/zeromq-subscriber/index.js .

RUN npm install

CMD [ "node", "index.js" ]
