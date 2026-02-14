FROM node:20-alpine
LABEL org.opencontainers.image.source=https://github.com/xomimishka/Diplom

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]