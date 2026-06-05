const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const User = require("../src/models/user.model");
const Assignment = require("../src/models/assignment.model");
const LeaveRequest = require("../src/models/leaverequest.model");

let mongoServer;
let parentToken;
let parent;
let student;
let teacher;

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
    assignedGroups: [new mongoose.Types.ObjectId()],
  });
  await student.save();

  parent = new User({
    firstName: "Parent",
    lastName: "User",
    email: "parent@example.com",
    password: "parentpass123",
    role: "Parent",
    childrenIds: [student._id],
  });
  await parent.save();

  parentToken = jwt.sign(
    { id: parent._id, role: parent.role },
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

describe("GET /api/parent/children", () => {
  it("should return children linked to the parent", async () => {
    const response = await request(app)
      .get("/api/parent/children")
      .set("Authorization", `Bearer ${parentToken}`);

    expect(response.status).toBe(200);
    expect(response.body.children).toHaveLength(1);
    expect(response.body.children[0].firstName).toBe("Student");
  });
});

describe("GET /api/parent/children/:studentId/assignments", () => {
  it("should return assignments for the child", async () => {
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
      .get(`/api/parent/children/${student._id}/assignments`)
      .set("Authorization", `Bearer ${parentToken}`);

    expect(response.status).toBe(200);
    expect(response.body.assignments).toHaveLength(1);
  });

  it("should reject access to non-child student", async () => {
    const otherStudent = new User({
      firstName: "Other",
      lastName: "Student",
      email: "other@example.com",
      password: "password123",
      role: "Student",
      teacherId: teacher._id,
      assignedGroups: [new mongoose.Types.ObjectId()],
    });
    await otherStudent.save();

    const response = await request(app)
      .get(`/api/parent/children/${otherStudent._id}/assignments`)
      .set("Authorization", `Bearer ${parentToken}`);

    expect(response.status).toBe(403);
  });
});

describe("POST /api/parent/leave-requests", () => {
  it("should create a leave request for the child", async () => {
    const response = await request(app)
      .post("/api/parent/leave-requests")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({
        studentId: student._id.toString(),
        date: "2026-05-15",
        reason: "Family emergency",
      });

    expect(response.status).toBe(201);
    expect(response.body.leaveRequest.reason).toBe("Family emergency");
  });

  it("should reject creating leave request for non-child", async () => {
    const otherStudent = new User({
      firstName: "Other",
      lastName: "Student",
      email: "other@example.com",
      password: "password123",
      role: "Student",
      teacherId: teacher._id,
      assignedGroups: [new mongoose.Types.ObjectId()],
    });
    await otherStudent.save();

    const response = await request(app)
      .post("/api/parent/leave-requests")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({
        studentId: otherStudent._id.toString(),
        date: "2026-05-15",
        reason: "Test",
      });

    expect(response.status).toBe(403);
  });
});
