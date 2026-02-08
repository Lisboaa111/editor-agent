FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

COPY src ./src
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/index.js"]
