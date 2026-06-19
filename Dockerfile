FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app

# Install server dependencies
COPY server/package.json server/package-lock.json* ./
RUN npm install --production

# Copy server code
COPY server/ ./

# Copy built frontend
COPY --from=client-build /app/client/dist ./dist

# Create data directory
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3100
ENV DATA_DIR=/app/data

EXPOSE 3100

CMD ["node", "src/index.js"]
