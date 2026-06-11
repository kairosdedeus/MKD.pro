FROM node:20-slim

# Instalar Python + yt-dlp + ffmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    --no-install-recommends \
    && pip3 install "yt-dlp[default,curl-cffi]" --break-system-packages \
    && npm install -g deno@2 \
    && deno --version \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json .
COPY server.js .

EXPOSE 3000
CMD ["node", "server.js"]
