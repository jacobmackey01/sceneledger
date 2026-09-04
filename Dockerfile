FROM node:24-slim

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY public ./public

USER node
EXPOSE 8080
CMD ["node", "src/server.js"]
