const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let User;
let Group;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  User = require("../src/models/user.model");
  Group = require("../src/models/group.model");
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

describe("Group model", () => {
  it("creates a valid group with teacher and students", async () => {
    const teacher = await new User({
      firstName: "Musa",
      lastName: "Hassan",
      email: "musa@example.com",
      password: "teacherpass123",
      role: "Teacher",
    }).save();

    const student = await new User({
      firstName: "Lina",
      lastName: "Farooq",
      email: "lina@example.com",
      password: "studentpass123",
      role: "Student",
      teacherId: teacher._id,
      assignedGroups: [new mongoose.Types.ObjectId()],
    }).save();

    const group = await new Group({
      name: "Nour Study Circle",
      teacherId: teacher._id,
      studentIds: [student._id],
      description: "Beginner Quran memorization cohort",
      grade: "Beginner",
    }).save();

    expect(group._id).toBeDefined();
    expect(group.teacherId.toString()).toBe(teacher._id.toString());
    expect(group.studentIds).toHaveLength(1);
    expect(group.studentIds[0].toString()).toBe(student._id.toString());
  });

  it("rejects group creation without a teacher", async () => {
    const group = new Group({
      name: "No Teacher Group",
      students: [],
    });

    await expect(group.save()).rejects.toThrow(
      /Group must have an assigned teacher/,
    );
  });

  it("rejects group creation with no initial students", async () => {
    const teacher = await new User({
      firstName: "Bilal",
      lastName: "Adnan",
      email: "bilal@example.com",
      password: "teacherpass123",
      role: "Teacher",
    }).save();

    const group = new Group({
      name: "Solo Teacher Group",
      teacherId: teacher._id,
    });

    await expect(group.save()).rejects.toThrow(
      /Group must include at least one student\./,
    );
  });
});
