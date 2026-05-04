FROM node:20

RUN apt-get update && apt-get install -y qbittorrent-nox && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --omit=dev --omit=peer

COPY assets assets
COPY scripts scripts
COPY src src
COPY styles styles
COPY views views
COPY favicon.ico index.html server.ts tsconfig.json ./

RUN mkdir -p /root/.config/qBittorrent
COPY docker/qbittorrent.conf /root/.config/qBittorrent/qBittorrent.conf
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
