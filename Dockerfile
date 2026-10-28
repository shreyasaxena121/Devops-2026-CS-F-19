FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json ./server/
RUN npm ci --prefix server --omit=dev

COPY server ./server

ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app/server
EXPOSE 5000

CMD ["npm", "start"]
