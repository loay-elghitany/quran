const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const User = require("../src/models/user.model");
const Group = require("../src/models/group.model");
const Assignment = require("../src/models/assignment.model");
const LeaveRequest = require("../src/models/leaverequest.model");

jest.mock("../src/services/notification.service");

let mongoServer;
let teacherToken;
let teacher;
let student;
let parent;

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
    phone: "+1234567890",
    role: "Parent",
    childrenIds: [student._id],
  });
  await parent.save();

  const group = new Group({
    name: "Test Group",
    teacherId: teacher._id,
    studentIds: [student._id],
  });
  await group.save();

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

describe("GET /api/teacher/students", () => {
  it("should return students assigned to the teacher", async () => {
    const response = await request(app)
      .get("/api/teacher/students")
      .set("Authorization", `Bearer ${teacherToken}`);

    expect(response.status).toBe(200);
    expect(response.body.students).toHaveLength(1);
    expect(response.body.students[0].firstName).toBe("Student");
  });
});

describe("POST /api/teacher/assignments", () => {
  it("should create an assignment and notify parent", async () => {
    const {
      sendWhatsAppMessage,
    } = require("../src/services/notification.service");

    const response = await request(app)
      .post("/api/teacher/assignments")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({
        student: student._id.toString(),
        date: "2026-05-12",
        attendanceStatus: "Present",
        newMemorization: { startVerse: 1, endVerse: 5, surahName: "Al-Fatiha" },
        reviewPast: { startVerse: 6, endVerse: 10, surahName: "Al-Baqarah" },
        evaluationTag: "Excellent",
        teacherNote: "Great job!",
      });

    expect(response.status).toBe(201);
    expect(response.body.assignment.evaluationTag).toBe("Excellent");
    expect(sendWhatsAppMessage).toHaveBeenCalledWith(
      parent.phone,
      `New assignment for Student: Excellent`,
    );
  });
});

describe("GET /api/teacher/leave-requests", () => {
  it("should return pending leave requests for the teacher", async () => {
    const leaveRequest = new LeaveRequest({
      student: student._id,
      parent: parent._id,
      teacher: teacher._id,
      date: new Date(),
      reason: "Sick",
    });
    await leaveRequest.save();

    const response = await request(app)
      .get("/api/teacher/leave-requests")
      .set("Authorization", `Bearer ${teacherToken}`);

    expect(response.status).toBe(200);
    expect(response.body.leaveRequests).toHaveLength(1);
  });
});

describe("PUT /api/teacher/leave-requests/:id/status", () => {
  it("should update leave request status", async () => {
    const leaveRequest = new LeaveRequest({
      student: student._id,
      parent: parent._id,
      teacher: teacher._id,
      date: new Date(),
      reason: "Sick",
    });
    await leaveRequest.save();

    const response = await request(app)
      .put(`/api/teacher/leave-requests/${leaveRequest._id}/status`)
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ status: "Approved" });

    expect(response.status).toBe(200);
    expect(response.body.leaveRequest.status).toBe("Approved");
  });
});
