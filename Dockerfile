FROM node:20

RUN apt-get update && apt-get install -y qbittorrent-nox curl && rm -rf /var/lib/apt/lists/*

# Install Jackett
RUN curl -sL "https://github.com/Jackett/Jackett/releases/latest/download/Jackett.Binaries.LinuxAMDx64.tar.gz" | tar -xz -C /opt

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

RUN mkdir -p /root/.config/Jackett
COPY docker/jackett-serverconfig.json /root/.config/Jackett/ServerConfig.json

# Install qBittorrent Jackett search plugin
RUN mkdir -p /root/.local/share/data/qBittorrent/nova3/engines
RUN curl -sL "https://raw.githubusercontent.com/qbittorrent/search-plugins/master/nova3/engines/jackett.py" \
    -o /root/.local/share/data/qBittorrent/nova3/engines/jackett.py
COPY docker/jackett-plugin.json /root/.local/share/data/qBittorrent/nova3/engines/jackett.json

COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
