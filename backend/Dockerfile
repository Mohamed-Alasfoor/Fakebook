# Use an official Go image to create a binary
FROM golang:1.22 AS builder

# Set working directory
WORKDIR /app

# Copy the module files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the entire project
COPY . .

# Build the Go application
RUN go build -o server .

# ---- Production Stage ----
FROM alpine:latest

WORKDIR /root/

# Copy the built server binary from builder
COPY --from=builder /app/server .

# Expose backend port (adjust if necessary)
EXPOSE 8080

# Run the server
CMD ["./server"]
