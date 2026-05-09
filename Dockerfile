FROM kunkkatorrents.azurecr.io/kunkka-torrent-base:latest

COPY assets assets
COPY scripts scripts
RUN chmod +x scripts/*.sh
COPY src src
COPY styles styles
COPY views views
COPY favicon.ico index.html server.ts tsconfig.json ./

COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
