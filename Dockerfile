FROM node:20-slim

RUN apt-get update && apt-get install -y qbittorrent-nox curl openssh-server python3 && rm -rf /var/lib/apt/lists/*

# Azure App Service SSH support (port 2222, password "Docker!")
COPY docker/sshd_config /etc/ssh/sshd_config
RUN mkdir -p /run/sshd /root/.ssh && \
    echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIK4RV9VJCeAKno6X9MYLp8U+boQLsLND5oynfOAJbOpo claude-debug" > /root/.ssh/authorized_keys && \
    chmod 700 /root/.ssh && chmod 600 /root/.ssh/authorized_keys
EXPOSE 2222

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
