const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const User = require("../src/models/user.model");

jest.mock("../src/services/quran.service");

let mongoServer;
let studentToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

beforeEach(async () => {
  const teacher = new User({
    firstName: "Teacher",
    lastName: "User",
    email: "teacher@example.com",
    password: "teacherpass123",
    role: "Teacher",
  });
  await teacher.save();

  const student = new User({
    firstName: "Student",
    lastName: "User",
    email: "student@example.com",
    password: "studentpass123",
    role: "Student",
    teacherId: teacher._id,
  });
  await student.save();

  studentToken = jwt.sign(
    { id: student._id, role: student.role },
    process.env.JWT_SECRET || "defaultsecret",
    { expiresIn: "24h" },
  );
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

describe("GET /api/leaderboard", () => {
  it("returns the students leaderboard and removes the old group and teacher endpoints", async () => {
    const studentsResponse = await request(app)
      .get("/api/leaderboard/students")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(studentsResponse.status).toBe(200);
    expect(studentsResponse.body).toHaveProperty("leaderboard");

    const groupsResponse = await request(app)
      .get("/api/leaderboard/groups")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(groupsResponse.status).toBe(404);

    const teachersResponse = await request(app)
      .get("/api/leaderboard/teachers")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(teachersResponse.status).toBe(404);
  });
});
