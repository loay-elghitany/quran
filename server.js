const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const fs = require("fs");
const mongoose = require("mongoose");
const app = require("./src/app");

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

const requiredEnv = ["MONGODB_URI", "JWT_SECRET", "FRONTEND_URL"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingEnv.join(", ")}`,
  );
  console.error("Please add them to .env before starting the server.");
  process.exit(1);
}

// ============================================================================
// PRODUCTION CONFIGURATION
// ============================================================================

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const NODE_ENV = process.env.NODE_ENV || "development";

// Validate environment
if (!["development", "staging", "production"].includes(NODE_ENV)) {
  console.warn(
    `⚠️  NODE_ENV="${NODE_ENV}" is not recognized. Using "development".`,
  );
}

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

const log = {
  info: (message) =>
    console.log(`[${new Date().toISOString()}] ℹ️  ${message}`),
  success: (message) =>
    console.log(`[${new Date().toISOString()}] ✅ ${message}`),
  warn: (message) =>
    console.warn(`[${new Date().toISOString()}] ⚠️  ${message}`),
  error: (message) =>
    console.error(`[${new Date().toISOString()}] ❌ ${message}`),
};

// ============================================================================
// UPLOADS DIRECTORY SETUP
// ============================================================================

const uploadsDir = path.join(__dirname, "uploads");
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
  const subdirs = ["audio", "pdfs", "temp"];
  subdirs.forEach((subdir) => {
    fs.mkdirSync(path.join(uploadsDir, subdir), { recursive: true });
  });
  app.use("/uploads", express.static(uploadsDir));
  log.success("Uploads directory configured");
} catch (error) {
  log.error(`Failed to setup uploads directory: ${error.message}`);
  process.exit(1);
}

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const connectDatabase = async () => {
  try {
    log.info("Connecting to MongoDB...");

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Connection pool configuration for production
      maxPoolSize: NODE_ENV === "production" ? 50 : 10,
      minPoolSize: NODE_ENV === "production" ? 10 : 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      w: "majority",
    });

    log.success("✨ Connected to MongoDB successfully");
    return true;
  } catch (error) {
    log.error(`MongoDB connection failed: ${error.message}`);
    return false;
  }
};

// ============================================================================
// SERVER STARTUP & GRACEFUL SHUTDOWN
// ============================================================================

let server;

const startServer = async () => {
  // Connect to database first
  const isConnected = await connectDatabase();
  if (!isConnected) {
    log.error("Failed to connect to database. Retrying in 5 seconds...");
    setTimeout(startServer, 5000);
    return;
  }

  // Start HTTP server
  server = app.listen(PORT, () => {
    log.success(
      `🚀 Backend server running on http://localhost:${PORT} (${NODE_ENV})`,
    );
    log.info(`CORS enabled for: ${process.env.FRONTEND_URL}`);
  });

  // Handle server errors
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      log.error(`Port ${PORT} is already in use`);
    } else {
      log.error(`Server error: ${error.message}`);
    }
    process.exit(1);
  });
};

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  log.warn(`${signal} signal received. Starting graceful shutdown...`);

  if (server) {
    // Stop accepting new connections
    server.close(async () => {
      log.info("HTTP server closed");

      try {
        // Close MongoDB connection
        await mongoose.connection.close();
        log.success("MongoDB connection closed");
        process.exit(0);
      } catch (error) {
        log.error(`Error during shutdown: ${error.message}`);
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      log.error("Forced shutdown after 30 seconds timeout");
      process.exit(1);
    }, 30000);
  }
};

// Handle termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  log.error(`Uncaught Exception: ${error.message}`);
  log.error(error.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  log.error(`Unhandled Rejection at ${promise}: ${reason}`);
  process.exit(1);
});

// ============================================================================
// START APPLICATION
// ============================================================================

startServer();
