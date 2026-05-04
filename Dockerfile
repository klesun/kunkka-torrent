FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --omit=dev --omit=peer

COPY assets assets
COPY scripts scripts
COPY src src
COPY styles styles
COPY views views
COPY favicon.ico index.html server.ts tsconfig.json ./

CMD ["npm", "start"]
