# Use Node for building the frontend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the full project
COPY . .

# Build the Next.js project
RUN npm run build

# ---- Production Stage ----
FROM node:18-alpine AS runner

WORKDIR /usr/src/app

# Copy necessary files for runtime
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public

# Expose port 3000 for Next.js
EXPOSE 3000

# Run the production server
CMD ["npm", "run", "start"]
