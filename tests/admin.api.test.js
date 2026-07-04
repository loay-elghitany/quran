const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const User = require("../src/models/user.model");
const Group = require("../src/models/group.model");

let mongoServer;
let adminToken;
let teacherToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

beforeEach(async () => {
  const admin = new User({
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

  const teacher = new User({
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

describe("POST /api/admin/users", () => {
  it("should create a user successfully as SuperAdmin", async () => {
    const response = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        firstName: "New",
        lastName: "Teacher",
        email: "newteacher@example.com",
        password: "newpass123",
        role: "Teacher",
      });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe("newteacher@example.com");
  });

  it("should reject creation without authentication", async () => {
    const response = await request(app).post("/api/admin/users").send({
      firstName: "New",
      lastName: "Teacher",
      email: "newteacher@example.com",
      password: "newpass123",
      role: "Teacher",
    });

    expect(response.status).toBe(401);
  });

  it("should reject creation with insufficient permissions", async () => {
    const response = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({
        firstName: "New",
        lastName: "Teacher",
        email: "newteacher@example.com",
        password: "newpass123",
        role: "Teacher",
      });

    expect(response.status).toBe(403);
  });

  it("should reject invalid role", async () => {
    const response = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        firstName: "New",
        lastName: "User",
        email: "newuser@example.com",
        password: "newpass123",
        role: "InvalidRole",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Invalid role. Must be Teacher, Student, or Parent.",
    );
  });
});

describe("POST /api/admin/grant-points-all", () => {
  it("should grant points to all students", async () => {
    const teacher = new User({
      firstName: "Reward",
      lastName: "Teacher",
      email: "rewardteacher@example.com",
      password: "teacherpass123",
      role: "Teacher",
    });
    await teacher.save();

    const student = new User({
      firstName: "Reward",
      lastName: "Student",
      email: "rewardstudent@example.com",
      password: "studentpass123",
      role: "Student",
      teacherId: teacher._id,
      points: 0,
    });
    await student.save();

    const response = await request(app)
      .post("/api/admin/grant-points-all")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ points: 25 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const updatedStudent = await User.findById(student._id);
    expect(updatedStudent.points).toBe(25);
  });
});

describe("POST /api/admin/grant-points-student", () => {
  it("should grant points to a specific student", async () => {
    const teacher = new User({
      firstName: "Target",
      lastName: "Teacher",
      email: "targetteacher@example.com",
      password: "teacherpass123",
      role: "Teacher",
    });
    await teacher.save();

    const student = new User({
      firstName: "Target",
      lastName: "Student",
      email: "targetstudent@example.com",
      password: "studentpass123",
      role: "Student",
      teacherId: teacher._id,
      points: 0,
    });
    await student.save();

    const response = await request(app)
      .post("/api/admin/grant-points-student")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ studentId: student._id.toString(), points: 40 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const updatedStudent = await User.findById(student._id);
    expect(updatedStudent.points).toBe(40);
  });
});

describe("POST /api/admin/groups", () => {
  it("should create a group successfully as SuperAdmin", async () => {
    const teacher = new User({
      firstName: "Group",
      lastName: "Teacher",
      email: "groupteacher@example.com",
      password: "teacherpass123",
      role: "Teacher",
    });
    await teacher.save();

    const student = new User({
      firstName: "Group",
      lastName: "Student",
      email: "groupstudent@example.com",
      password: "studentpass123",
      role: "Student",
      teacherId: teacher._id,
      assignedGroups: [],
    });
    await student.save();

    const response = await request(app)
      .post("/api/admin/groups")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test Group",
        teacherId: teacher._id.toString(),
        studentIds: [student._id.toString()],
        description: "A test group",
      });

    expect(response.status).toBe(201);
    expect(response.body.group.name).toBe("Test Group");
  });

  it("should reject group creation without teacher", async () => {
    const response = await request(app)
      .post("/api/admin/groups")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test Group",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Teacher is required.");
  });
});
