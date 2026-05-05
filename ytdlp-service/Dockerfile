FROM node:20-slim

# Instalar Python + yt-dlp + ffmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    --no-install-recommends \
    && pip3 install yt-dlp --break-system-packages \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json .
COPY server.js .

EXPOSE 3000
CMD ["node", "server.js"]
