# Production Deployment Guide - MERN Stack

## Overview

This document provides production-ready configurations and deployment strategies for your Quran Memorization Application supporting 200-300 concurrent users.

---

## Table of Contents

1. [Environment Configuration](#environment-configuration)
2. [Security Checklist](#security-checklist)
3. [Performance Optimization](#performance-optimization)
4. [Deployment Strategies](#deployment-strategies)
5. [Monitoring & Logging](#monitoring--logging)
6. [Troubleshooting](#troubleshooting)

---

## Environment Configuration

### Production `.env` Template

Create a `.env.production` file with these values:

```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com

# MongoDB: Use dedicated production credentials
# - Create a separate MongoDB user (not admin)
# - Enable IP whitelist
# - Use connection pooling (maxPoolSize: 50)
MONGODB_URI=mongodb+srv://prod_user:securePassword@prod-cluster.mongodb.net/quran_prod?retryWrites=true&w=majority

# JWT Secret: Strong 32+ character random string
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<your-strong-32-char-random-string>

# Optional services
TWILIO_ACCOUNT_SID=<your-account-sid>
TWILIO_AUTH_TOKEN=<your-auth-token>
TWILIO_PHONE_NUMBER=+1234567890
```

### Environment Variables NOT to Hardcode

❌ Database credentials
❌ API keys and secrets
❌ JWT secrets
❌ Twilio/Telegram tokens

✅ Use environment management services:

- **AWS**: Secrets Manager or Systems Manager Parameter Store
- **Heroku**: Config Vars
- **Digital Ocean**: App Platform Environment
- **Azure**: Key Vault
- **GitHub**: Secrets (for CI/CD)
- **Docker**: `.env` files + secret management

---

## Security Checklist

### ✅ CORS Configuration

Your app now enforces strict CORS in production:

```javascript
// Only allows requests from specified FRONTEND_URL
// Development: allows localhost variants
// Production: exact domain matching only
```

**Action Items:**

- [ ] Update `FRONTEND_URL` to your production domain
- [ ] Test CORS with real domain before deployment
- [ ] Verify browser console has no CORS errors

### ✅ Helmet Security Headers

Enabled headers protect against:

- **X-Frame-Options**: Clickjacking prevention
- **X-Content-Type-Options**: MIME sniffing prevention
- **Strict-Transport-Security (HSTS)**: Force HTTPS for 1 year
- **Content Security Policy (CSP)**: XSS protection

**Test CORS headers:**

```bash
curl -I -H "Origin: https://yourdomain.com" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:5000/api/auth/login
```

### ✅ Rate Limiting

- General endpoints: **100 requests per 15 minutes**
- Auth endpoints: **5 attempts per 15 minutes**
- Prevents brute force and DoS attacks

**Adjust limits in `src/app.js`:**

```javascript
const generalLimiter = rateLimit({
  max: NODE_ENV === "production" ? 100 : 1000, // Increase for your needs
  windowMs: 15 * 60 * 1000,
});
```

### ✅ Database Security

1. **Dedicated MongoDB User:**

   ```
   Username: prod_user (NOT admin)
   Permissions: Read/Write on quran_prod database only
   ```

2. **IP Whitelist:**
   - Add only your production server IP
   - Remove any 0.0.0.0/0 access
   - MongoDB Atlas → Network Access → Add IP Address

3. **Connection Pooling:**
   - Already configured: `maxPoolSize: 50` for production
   - Supports 200-300 concurrent users efficiently

4. **Encryption:**
   - Enable TLS/SSL in connection string
   - Use `mongodb+srv://` (DNS seed list, auto-TLS)

### ✅ HTTPS/TLS

**CRITICAL FOR PRODUCTION:**

- Use HTTPS everywhere (never HTTP in production)
- Use a reverse proxy (nginx, Caddy) to handle TLS
- Obtain certificate from Let's Encrypt (free) or CA
- Redirect HTTP → HTTPS

**Example nginx config:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### ✅ Input Validation

All routes should validate input with Joi. Example:

```javascript
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const { error, value } = schema.validate(req.body);
if (error) {
  return res.status(400).json({ error: error.details });
}
```

### ✅ Error Handling

Your app now has a **global error handler** that:

- Prevents stack traces in production
- Handles MongoDB validation errors
- Catches JWT token errors
- Manages rate limit errors
- Logs all errors with request IDs for debugging

**Check error logs:**

```bash
# View recent errors
tail -f /var/log/app.log | grep ERROR
```

---

## Performance Optimization

### ✅ Compression (Gzip)

Automatically enabled - reduces response size by 60-80%:

```javascript
app.use(compression()); // Gzips responses > 1KB
```

### ✅ Request Logging

Production logging includes:

- Request ID (tracking across logs)
- HTTP method and path
- Response status code
- Response time in milliseconds

```
[2024-06-05T10:30:45.123Z] INFO - req-123456 | POST /api/auth/login | Status: 200 | 145ms
```

### ✅ Connection Pooling

MongoDB connection pool configured for production:

```javascript
maxPoolSize: 50,      // 50 concurrent connections
minPoolSize: 10,      // Keep 10 warm
socketTimeoutMS: 45000  // 45 second timeout
```

### ✅ Health Check Endpoint

Monitor your API availability:

```bash
curl http://localhost:5000/api/health
# Response:
{
  "status": "healthy",
  "timestamp": "2024-06-05T10:30:45.123Z",
  "uptime": 3600.5,
  "environment": "production"
}
```

### ✅ Body Size Limits

Request payloads limited to 10KB (prevents DoS):

```javascript
app.use(express.json({ limit: "10kb" }));
```

Increase if needed (e.g., for file uploads):

```javascript
app.use(express.json({ limit: "50mb" })); // For large uploads
```

---

## Deployment Strategies

### Option 1: Traditional VPS (Recommended for Learning)

**Providers:** AWS EC2, Digital Ocean, Linode, Hetzner

**Steps:**

```bash
# 1. SSH into your server
ssh ubuntu@your-server-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install MongoDB (or use MongoDB Atlas)
sudo apt-get install -y mongodb

# 4. Clone your repo
git clone <your-repo-url>
cd quran
npm install

# 5. Create .env.production with production values
sudo nano .env.production

# 6. Start with PM2 (process manager)
npm install -g pm2
pm2 start server.js --name "quran-api" --env production
pm2 save
pm2 startup

# 7. Configure reverse proxy (nginx)
sudo apt-get install -y nginx
# Create config (see nginx example above)
sudo nano /etc/nginx/sites-available/quran
sudo ln -s /etc/nginx/sites-available/quran /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

### Option 2: Docker Containerization

**Recommended for scalability and consistency**

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t quran-api:1.0 .
docker run -d \
  --name quran-api \
  -p 5000:5000 \
  --env-file .env.production \
  quran-api:1.0
```

### Option 3: Serverless (AWS Lambda)

**Best for:** Variable traffic, minimal ops overhead

**Requirements:**

- Use serverless framework or AWS SAM
- Export Express app as Lambda handler
- Use MongoDB Atlas (not self-hosted MongoDB)

### Option 4: PaaS (Platform as a Service)

**Easiest for beginners**

- **Heroku**: `git push heroku main` → Deployed
- **Railway.app**: Connect repo → Auto-deploy
- **Render**: Free tier available

All handle SSL certificates, reverse proxy, and scaling.

---

## Monitoring & Logging

### ✅ Error Tracking

Implement Sentry or similar:

```bash
npm install @sentry/node
```

```javascript
// server.js
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: NODE_ENV,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.errorHandler());
```

### ✅ Logs Aggregation

For 200-300 users, centralize logs:

- **Cloud Providers:** CloudWatch (AWS), Azure Monitor
- **Self-Hosted:** ELK Stack (Elasticsearch, Logstash, Kibana)
- **Third-Party:** Datadog, LogRocket, Papertrail

### ✅ Performance Monitoring

Monitor these metrics:

- **Response Time:** Should be < 200ms (p95)
- **Error Rate:** Should be < 1%
- **CPU Usage:** Keep below 70%
- **Memory Usage:** Keep below 80%
- **Database Connections:** Keep below 50
- **Concurrent Users:** Track via logs

---

## Troubleshooting

### Issue: CORS Errors in Production

```
Access-Control-Allow-Origin: Not matching
```

**Solution:**

```bash
# Check your FRONTEND_URL
echo $FRONTEND_URL
# Should match exactly: https://yourdomain.com (NO trailing slash)

# Test CORS
curl -H "Origin: https://yourdomain.com" http://api.yourdomain.com/api/health
```

### Issue: Database Connection Timeouts

```
MongoDB connection failed: Connection timeout
```

**Solution:**

1. Check IP whitelist in MongoDB Atlas
2. Verify credentials are correct
3. Increase `serverSelectionTimeoutMS`:
   ```javascript
   serverSelectionTimeoutMS: 10000; // 10 seconds
   ```
4. Check network connectivity:
   ```bash
   ping cluster0.eplzmdl.mongodb.net
   ```

### Issue: Rate Limiting Too Strict

Users getting 429 (Too Many Requests) too fast.

**Solution:**

```javascript
// In src/app.js, adjust limits
const generalLimiter = rateLimit({
  max: 500, // Increase from 100
  windowMs: 15 * 60 * 1000,
});
```

### Issue: Memory Leaks

Memory usage keeps increasing.

**Solution:**

```bash
# Monitor memory
pm2 monit

# Check for connection leaks
db.currentOp()
db.serverStatus().connections
```

### Issue: High Response Times

Endpoints taking > 500ms to respond.

**Solution:**

1. Enable request logging to find slow endpoints:
   ```javascript
   // Check logs for high duration values
   tail -f logs/app.log | grep "ms" | sort
   ```
2. Add database indexes:
   ```javascript
   // In your models
   userSchema.index({ email: 1 }); // Speed up email lookups
   ```
3. Enable Redis caching for frequently accessed data

---

## Graceful Shutdown

Your app now handles graceful shutdown:

**On SIGTERM signal:**

1. Stop accepting new requests
2. Wait for existing requests to finish
3. Close MongoDB connection
4. Exit cleanly

This prevents data corruption during deployments.

**Example with PM2:**

```bash
pm2 stop quran-api      # Graceful stop (30 sec timeout)
pm2 restart quran-api   # Graceful restart
```

---

## Checklist Before Going Live

- [ ] Update `FRONTEND_URL` to production domain in `.env.production`
- [ ] Set strong `JWT_SECRET` (32+ random characters)
- [ ] Create dedicated MongoDB user (not admin)
- [ ] Enable IP whitelist on MongoDB Atlas
- [ ] Obtain SSL/TLS certificate (Let's Encrypt preferred)
- [ ] Configure nginx reverse proxy with HTTPS
- [ ] Test CORS with production domain
- [ ] Set up health check monitoring
- [ ] Configure error logging (Sentry/DataDog)
- [ ] Load test with 300+ concurrent users
- [ ] Review security headers (curl -I)
- [ ] Document your deployment process
- [ ] Set up automated backups for database
- [ ] Implement database replication/sharding for scale
- [ ] Set up CI/CD pipeline (GitHub Actions, GitLab CI)

---

## Quick Reference: Environment Variables

| Variable       | Dev Example             | Prod Example                  | Security Level |
| -------------- | ----------------------- | ----------------------------- | -------------- |
| `NODE_ENV`     | `development`           | `production`                  | 🟢 Safe        |
| `FRONTEND_URL` | `http://localhost:5173` | `https://yourdomain.com`      | 🟢 Safe        |
| `PORT`         | `5000`                  | `5000` (with nginx)           | 🟢 Safe        |
| `MONGODB_URI`  | `mongodb://localhost`   | `mongodb+srv://user:pass@...` | 🔴 Secret      |
| `JWT_SECRET`   | `dev-key`               | `<32-char-random>`            | 🔴 Secret      |
| `TWILIO_*`     | `dev-key`               | `production-key`              | 🔴 Secret      |

---

## Support & Resources

- **Express.js:** https://expressjs.com/
- **MongoDB Security:** https://docs.mongodb.com/manual/security/
- **OWASP Security:** https://owasp.org/www-project-secure-coding-practices/
- **Node.js Best Practices:** https://github.com/goldbergyoni/nodebestpractices

---

## Questions?

Review the code in:

- `server.js` - Graceful shutdown & DB connection
- `src/app.js` - Security, CORS, error handling
- `.env` - Environment template

All configurations are well-commented for clarity.

Good luck with your production deployment! 🚀
