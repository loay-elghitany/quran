const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/user.model");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterEach(async () => {
  const collections = Object.keys(mongoose.connection.collections);
  for (const collectionName of collections) {
    await mongoose.connection.collections[collectionName].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("POST /api/auth/login", () => {
  it("should login successfully with valid credentials", async () => {
    const user = new User({
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      password: "password123",
      role: "SuperAdmin",
    });
    await user.save();

    const response = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body.user.email).toBe("test@example.com");
  });

  it("should reject login with invalid email", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "nonexistent@example.com",
      password: "password123",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid credentials.");
  });

  it("should reject login with invalid password", async () => {
    const user = new User({
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      password: "password123",
      role: "SuperAdmin",
    });
    await user.save();

    const response = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "wrongpassword",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid credentials.");
  });

  it("should reject login with missing fields", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Email and password are required.");
  });
});
