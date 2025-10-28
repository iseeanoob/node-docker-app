# ========================================
# 🚀 Stage 1 — Build and install dependencies
# ========================================
FROM node:20 AS build

WORKDIR /usr/src/app

# Copy dependency files first (for caching)
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy application code
COPY . .

# ========================================
# 🧠 Stage 2 — Run the Node.js app
# ========================================
FROM node:20-slim

WORKDIR /usr/src/app

# Copy only built app and dependencies from build stage
COPY --from=build /usr/src/app ./

# Set environment variables (can be overridden in compose)
ENV NODE_ENV=production
ENV PORT=3000

# Expose app port
EXPOSE 3000

# Default start command
CMD ["npm", "start"]
