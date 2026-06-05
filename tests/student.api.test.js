const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const User = require("../src/models/user.model");
const Group = require("../src/models/group.model");
const Assignment = require("../src/models/assignment.model");
const ContentQuiz = require("../src/models/contentquiz.model");

jest.mock("../src/services/quran.service");

let mongoServer;
let studentToken;
let student;
let teacher;
let quiz;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

beforeEach(async () => {
  teacher = new User({
    firstName: "Teacher",
    lastName: "User",
    email: "teacher@example.com",
    password: "teacherpass123",
    role: "Teacher",
  });
  await teacher.save();
  student = new User({
    firstName: "Student",
    lastName: "User",
    email: "student@example.com",
    password: "studentpass123",
    role: "Student",
    teacherId: teacher._id,
    assignedGroups: [],
  });
  await student.save();

  const group = new Group({
    name: "Test Group",
    teacherId: teacher._id,
    studentIds: [student._id],
  });
  await group.save();

  // assign group back to student
  student.assignedGroups = [group._id];
  await student.save();

  studentToken = jwt.sign(
    { id: student._id, role: student.role },
    process.env.JWT_SECRET || "defaultsecret",
    { expiresIn: "24h" },
  );

  quiz = new ContentQuiz({
    videoTitle: "Test Quiz",
    youtubeUrl: "https://www.youtube.com/watch?v=test123",
    questions: [
      {
        questionText: "What is the first Surah?",
        options: ["Al-Fatiha", "Al-Baqarah", "Al-Imran"],
        correctAnswer: "Al-Fatiha",
      },
      {
        questionText: "How many surahs in the Quran?",
        options: ["112", "114", "120"],
        correctAnswer: "114",
      },
    ],
  });
  await quiz.save();
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

describe("GET /api/student/my-assignments", () => {
  it("should fetch all assignments for the student", async () => {
    const assignment = new Assignment({
      student: student._id,
      teacher: teacher._id,
      date: new Date(),
      attendanceStatus: "Present",
      newMemorization: { startVerse: 1, endVerse: 5, surahName: "Al-Fatiha" },
      reviewPast: { startVerse: 6, endVerse: 10, surahName: "Al-Baqarah" },
      evaluationTag: "Excellent",
    });
    await assignment.save();

    const response = await request(app)
      .get("/api/student/my-assignments")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(response.status).toBe(200);
    expect(response.body.assignments).toHaveLength(1);
    expect(response.body.assignments[0].evaluationTag).toBe("Excellent");
  });
});

describe("GET /api/student/my-assignments/:id/read", () => {
  it("should fetch assignment with Quranic text from mocked service", async () => {
    const { fetchVerses } = require("../src/services/quran.service");
    fetchVerses.mockReturnValue([
      { verseNumber: 1, text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" },
      { verseNumber: 2, text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ" },
    ]);

    const assignment = new Assignment({
      student: student._id,
      teacher: teacher._id,
      date: new Date(),
      attendanceStatus: "Present",
      newMemorization: { startVerse: 1, endVerse: 2, surahName: "Al-Fatiha" },
      reviewPast: { startVerse: 3, endVerse: 4, surahName: "Al-Baqarah" },
      evaluationTag: "Good",
    });
    await assignment.save();

    const response = await request(app)
      .get(`/api/student/my-assignments/${assignment._id}/read`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(response.status).toBe(200);
    expect(response.body.assignment.newMemorization.verses).toBeDefined();
    expect(response.body.assignment.reviewPast.verses).toBeDefined();
    expect(fetchVerses).toHaveBeenCalledWith("Al-Fatiha", 1, 2);
  });
});

describe("GET /api/student/quizzes", () => {
  it("should fetch quizzes without correctAnswer field", async () => {
    const response = await request(app)
      .get("/api/student/quizzes")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(response.status).toBe(200);
    expect(response.body.quizzes).toHaveLength(1);
    expect(response.body.quizzes[0].questions[0]).not.toHaveProperty(
      "correctAnswer",
    );
    expect(response.body.quizzes[0].questions[0]).toHaveProperty(
      "questionText",
    );
  });
});

describe("POST /api/student/quizzes/:id/submit", () => {
  it("should calculate and return quiz score", async () => {
    const response = await request(app)
      .post(`/api/student/quizzes/${quiz._id}/submit`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        answers: ["Al-Fatiha", "114"],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("score");
    expect(response.body.score).toBe(2); // Both answers correct
  });

  it("should calculate partial score for wrong answers", async () => {
    const response = await request(app)
      .post(`/api/student/quizzes/${quiz._id}/submit`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        answers: ["Al-Baqarah", "114"], // First is wrong
      });

    expect(response.status).toBe(200);
    expect(response.body.score).toBe(1);
  });
});
