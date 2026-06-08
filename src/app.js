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
const { mapErrorToResponse } = require("./utils/error.helper");

const app = express();
const NODE_ENV = process.env.NODE_ENV || "development";

// ============================================================================
// TRUST PROXY (for accurate client IP behind reverse proxies/load balancers)
// ============================================================================
app.set("trust proxy", 1);

// ============================================================================
// SECURITY MIDDLEWARE: HELMET
// ============================================================================
// Safely parse FRONTEND_URL and build CSP directives
const _rawFrontendUrl = (process.env.FRONTEND_URL || "").toString().trim();
let _parsedFrontendOrigin = null;
if (_rawFrontendUrl) {
  try {
    const u = new URL(_rawFrontendUrl);
    _parsedFrontendOrigin = u.origin;
  } catch (err) {
    console.warn(
      `Invalid FRONTEND_URL provided: ${_rawFrontendUrl} — ignoring.`,
    );
    _parsedFrontendOrigin = null;
  }
}
const FRONTEND_URL_SAFE = _parsedFrontendOrigin || "http://localhost:5173";
if (!_parsedFrontendOrigin) {
  console.warn(
    `FRONTEND_URL not set or invalid; using fallback ${FRONTEND_URL_SAFE}`,
  );
}

// Build connect-src: always include 'self', add validated frontend origin, or allow general connections as fallback
// ============================================================================
// FIX: BUILD SAFE CONNECT-SRC FOR HELMET (CSP)
// ============================================================================
const connectSrc = ["'self'"];

// لو الرابط موجود، نأخذ الـ origin وننظفه تماماً من أي علامة مائلة في الآخر
if (_parsedFrontendOrigin) {
  const cleanOrigin = _parsedFrontendOrigin.replace(/\/$/, "");
  connectSrc.push(cleanOrigin);
} else {
  // بديل آمن للنجمة لتجنب اعتراض Helmet الصارم
  connectSrc.push("http://*");
  connectSrc.push("https://*");
}

const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'"],
  connectSrc: connectSrc, // تمرير المصفوفة النظيفة
  imgSrc: ["'self'", "data:", "blob:", "*.cloudinary.com"],
  mediaSrc: ["'self'", "blob:", "*.cloudinary.com"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  fontSrc: ["'self'", "data:"],
  frameAncestors: ["'self'"],
};
// Only enable upgrade-insecure-requests directive in production (present as an empty array)
if (NODE_ENV === "production") {
  cspDirectives.upgradeInsecureRequests = [];
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: cspDirectives,
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
// Use the safely parsed frontend origin (falls back to localhost if missing/invalid)
const FRONTEND_URL = FRONTEND_URL_SAFE;
if (!_rawFrontendUrl && NODE_ENV === "production") {
  console.warn(
    "FRONTEND_URL was not provided in the environment; using fallback for CORS. This may be less strict than intended.",
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
    success: false,
    message: `عذراً، المسار ${req.method} ${req.path} غير موجود.`,
  });
});

// ============================================================================
// GLOBAL ERROR HANDLING MIDDLEWARE
// ============================================================================
// IMPORTANT: This must be the last middleware (after all route handlers)
app.use((err, req, res, next) => {
  const requestId = res.get("X-Request-ID") || "UNKNOWN";
  const timestamp = new Date().toISOString();

  console.error(`[${timestamp}] ERROR - ${requestId}`);
  console.error(err);

  if (NODE_ENV !== "production") {
    console.error(err.stack);
  }

  const mapped = mapErrorToResponse(err);
  const response = {
    success: false,
    message: mapped.message,
  };

  if (mapped.details) {
    response.details = mapped.details;
  }

  if (mapped.field) {
    response.field = mapped.field;
  }

  res.status(mapped.statusCode).json(response);
});

module.exports = app;
