FROM node:20-slim

# Install tzdata buat kamus zona waktu dunia
RUN apt-get update && apt-get install -y tzdata

# Set zona waktu ke Jakarta biar container-nya pinter
ENV TZ=Asia/Jakarta

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Pastikan port lo sesuai (tadi lo pake 5001 di compose)
EXPOSE 5001

CMD ["node", "server.js"]
