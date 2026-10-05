FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

# Install dependencies first for better layer caching.
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy the application source, owned by the unprivileged "node" user
# (the map renderer writes its cache into assets/).
COPY --chown=node:node . .

USER node

CMD ["npm", "start"]
