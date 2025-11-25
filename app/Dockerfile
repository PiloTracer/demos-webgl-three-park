FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies (will be cached in layer)
RUN npm install

COPY . .

EXPOSE 6968

# Ensure dependencies are current on start (handles volume mount shadowing)
CMD ["sh", "-c", "npm install && npm run dev -- --host 0.0.0.0 --port 6968"]
