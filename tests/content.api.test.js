const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const User = require("../src/models/user.model");
const ContentQuiz = require("../src/models/contentquiz.model");

jest.mock("../src/services/quran.service");

let mongoServer;
let adminToken;
let teacherToken;
let admin;
let teacher;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

beforeEach(async () => {
  admin = new User({
    firstName: "Admin",
    lastName: "User",
    email: "admin@example.com",
    password: "adminpass123",
    role: "SuperAdmin",
  });
  await admin.save();
  adminToken = jwt.sign(
    { id: admin._id, role: admin.role },
    process.env.JWT_SECRET || "defaultsecret",
    { expiresIn: "24h" },
  );

  teacher = new User({
    firstName: "Teacher",
    lastName: "User",
    email: "teacher@example.com",
    password: "teacherpass123",
    role: "Teacher",
  });
  await teacher.save();
  teacherToken = jwt.sign(
    { id: teacher._id, role: teacher.role },
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

describe("POST /api/content/quizzes", () => {
  it("should create a quiz as SuperAdmin", async () => {
    const response = await request(app)
      .post("/api/content/quizzes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        videoTitle: "Tajweed Basics",
        youtubeUrl: "https://www.youtube.com/watch?v=abc123",
        questions: [
          {
            questionText: "What is Tajweed?",
            options: ["Rules of recitation", "Prayer", "Fasting"],
            correctAnswer: "Rules of recitation",
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.quiz.videoTitle).toBe("Tajweed Basics");
  });

  it("should create a quiz as Teacher", async () => {
    const response = await request(app)
      .post("/api/content/quizzes")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({
        videoTitle: "Surah Al-Fatiha",
        youtubeUrl: "https://www.youtube.com/watch?v=xyz789",
        questions: [
          {
            questionText: "First Surah name?",
            options: ["Al-Fatiha", "Al-Baqarah"],
            correctAnswer: "Al-Fatiha",
          },
        ],
      });

    expect(response.status).toBe(201);
  });

  it("should reject quiz creation for non-admin/non-teacher", async () => {
    const student = new User({
      firstName: "Student",
      lastName: "User",
      email: "student@example.com",
      password: "studentpass123",
      role: "Student",
      teacherId: teacher._id,
      assignedGroups: [new mongoose.Types.ObjectId()],
    });
    await student.save();

    const studentToken = jwt.sign(
      { id: student._id, role: student.role },
      process.env.JWT_SECRET || "defaultsecret",
      { expiresIn: "24h" },
    );

    const response = await request(app)
      .post("/api/content/quizzes")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        videoTitle: "Test",
        youtubeUrl: "https://www.youtube.com/watch?v=test",
        questions: [],
      });

    expect(response.status).toBe(403);
  });
});

describe("GET /api/content/quizzes", () => {
  it("should fetch all quizzes", async () => {
    await new ContentQuiz({
      videoTitle: "Quiz 1",
      youtubeUrl: "https://www.youtube.com/watch?v=quiz1",
      questions: [],
    }).save();

    const response = await request(app)
      .get("/api/content/quizzes")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.quizzes).toHaveLength(1);
  });
});
