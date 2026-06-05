const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const teacherRoutes = require("./routes/teacher.routes");
const parentRoutes = require("./routes/parent.routes");
const contentRoutes = require("./routes/content.routes");
const studentRoutes = require("./routes/student.routes");
const leaderboardRoutes = require("./routes/leaderboard.routes");
const announcementRoutes = require("./routes/announcement.routes");
const groupsRoutes = require("./routes/groups.routes");
const ticketRoutes = require("./routes/ticket.routes");

const app = express();
const NODE_ENV = process.env.NODE_ENV || "development";

// ============================================================================
// TRUST PROXY (for accurate client IP behind reverse proxies/load balancers)
// ============================================================================
app.set("trust proxy", 1);

// ============================================================================
// SECURITY MIDDLEWARE: HELMET
// ============================================================================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        connectSrc: [
          "'self'",
          process.env.FRONTEND_URL || "http://localhost:5173",
        ],
        imgSrc: ["'self'", "data:", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", "data:"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: NODE_ENV === "production" ? [] : null,
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
  }),
);

// ============================================================================
// CORS CONFIGURATION
// ============================================================================
const FRONTEND_URL = process.env.FRONTEND_URL;
if (!FRONTEND_URL) {
  throw new Error(
    "❌ Missing FRONTEND_URL environment variable. Set FRONTEND_URL in .env before starting the server.",
  );
}

// In production, use exact origin matching
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Production: strict origin matching
    if (NODE_ENV === "production") {
      if (origin === FRONTEND_URL) {
        return callback(null, true);
      }
      return callback(
        new Error(
          `CORS policy violation: Origin "${origin}" is not allowed. Only "${FRONTEND_URL}" is permitted.`,
        ),
        false,
      );
    }

    // Development: allow localhost variants
    const allowedOrigins = [
      FRONTEND_URL,
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
    ];

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error(`CORS policy violation: Origin "${origin}" is not allowed.`),
      false,
    );
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["X-Total-Count", "X-Page-Number"],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// ============================================================================
// RATE LIMITING
// ============================================================================

// General rate limiter: 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === "production" ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/api/health";
  },
});

// Strict rate limiter for auth endpoints: 5 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many login attempts. Please try again after 15 minutes.",
  },
});

app.use(generalLimiter);

// ============================================================================
// BODY PARSING MIDDLEWARE
// ============================================================================
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ limit: "10kb", extended: true }));

// ============================================================================
// COMPRESSION MIDDLEWARE
// ============================================================================
app.use(compression());

// ============================================================================
// REQUEST LOGGING MIDDLEWARE (Production-ready)
// ============================================================================
app.use((req, res, next) => {
  const requestStart = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Attach request ID to response headers
  res.set("X-Request-ID", requestId);

  // Override res.json to log response status
  const originalJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - requestStart;
    const logLevel =
      res.statusCode >= 500 ? "ERROR" : res.statusCode >= 400 ? "WARN" : "INFO";

    if (NODE_ENV === "production" || res.statusCode >= 400) {
      console.log(
        `[${new Date().toISOString()}] ${logLevel} - ${requestId} | ${req.method} ${req.path} | Status: ${res.statusCode} | ${duration}ms`,
      );
    }

    return originalJson.call(this, data);
  };

  next();
});

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

// Auth routes (with strict rate limiting)
app.use("/api/auth", authLimiter, authRoutes);

// Other routes
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin/complaints", ticketRoutes); // Tickets: both public and admin-facing
app.use("/api/admin", adminRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/groups", groupsRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/announcements", announcementRoutes);

// ============================================================================
// 404 NOT FOUND HANDLER
// ============================================================================
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `The requested endpoint ${req.method} ${req.path} does not exist.`,
    statusCode: 404,
  });
});

// ============================================================================
// GLOBAL ERROR HANDLING MIDDLEWARE
// ============================================================================
// IMPORTANT: This must be the last middleware (after all route handlers)
app.use((err, req, res, next) => {
  const requestId = res.get("X-Request-ID") || "UNKNOWN";
  const timestamp = new Date().toISOString();

  // Default error object
  let error = {
    statusCode: err.statusCode || 500,
    message: err.message || "Internal Server Error",
    error: err.name || "Error",
    requestId,
    timestamp,
  };

  // Log error details
  console.error(`[${timestamp}] ERROR - ${requestId}`);
  console.error(`  Status: ${error.statusCode}`);
  console.error(`  Message: ${error.message}`);
  console.error(`  Path: ${req.method} ${req.path}`);

  if (NODE_ENV !== "production") {
    console.error(`  Stack: ${err.stack}`);
  }

  // ========================================================================
  // HANDLE SPECIFIC ERROR TYPES
  // ========================================================================

  // MongoDB Validation Error
  if (err.name === "ValidationError") {
    error.statusCode = 400;
    error.error = "Validation Error";
    error.details = Object.keys(err.errors).map((key) => ({
      field: key,
      message: err.errors[key].message,
    }));
  }

  // MongoDB Cast Error (invalid ObjectId)
  if (err.name === "CastError") {
    error.statusCode = 400;
    error.error = "Invalid ID Format";
    error.message = `Invalid ${err.kind}: ${err.value}`;
  }

  // MongoDB Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    error.statusCode = 409;
    error.error = "Duplicate Entry";
    error.message = `A record with this ${field} already exists.`;
    error.field = field;
  }

  // JWT Errors
  if (err.name === "JsonWebTokenError") {
    error.statusCode = 401;
    error.error = "Invalid Token";
    error.message = "The provided token is invalid or malformed.";
  }

  if (err.name === "TokenExpiredError") {
    error.statusCode = 401;
    error.error = "Token Expired";
    error.message = "Your session has expired. Please log in again.";
  }

  // CORS Errors
  if (err.message && err.message.includes("CORS")) {
    error.statusCode = 403;
    error.error = "CORS Policy Violation";
  }

  // Rate Limit Errors
  if (err.status === 429) {
    error.statusCode = 429;
    error.error = "Too Many Requests";
    error.message = err.message || "Please try again later.";
  }

  // Multer file upload errors
  if (err.name === "MulterError") {
    error.statusCode = 400;
    error.error = "File Upload Error";
    if (err.code === "FILE_TOO_LARGE") {
      error.message = `File size exceeds the limit of ${err.limit} bytes.`;
    } else if (err.code === "LIMIT_FILE_COUNT") {
      error.message = `Too many files. Maximum allowed: ${err.limit}.`;
    }
  }

  // Joi validation errors
  if (err.isJoi) {
    error.statusCode = 400;
    error.error = "Validation Error";
    error.details = err.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));
  }

  // ========================================================================
  // SECURITY: Don't expose sensitive information in production
  // ========================================================================
  if (NODE_ENV === "production") {
    // Remove stack trace in production
    delete error.stack;

    // Generic message for 500 errors
    if (error.statusCode === 500) {
      error.message = "An internal error occurred. Please try again later.";
    }
  }

  // Ensure status code is within valid HTTP range
  const statusCode = error.statusCode || 500;
  const finalStatusCode =
    statusCode >= 100 && statusCode < 600 ? statusCode : 500;

  res.status(finalStatusCode).json(error);
});

module.exports = app;
