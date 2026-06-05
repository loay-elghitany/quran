const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let User;
let LeaveRequest;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  User = require("../src/models/user.model");
  LeaveRequest = require("../src/models/leaverequest.model");
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

describe("LeaveRequest model", () => {
  it("creates a valid leave request with default status", async () => {
    const teacher = await new User({
      firstName: "Yusuf",
      lastName: "Ali",
      email: "yusuf@example.com",
      password: "teacherpass123",
      role: "Teacher",
    }).save();

    const student = await new User({
      firstName: "Fatima",
      lastName: "Noor",
      email: "fatima@example.com",
      password: "studentpass123",
      role: "Student",
      teacherId: teacher._id,
      assignedGroups: [new mongoose.Types.ObjectId()],
    }).save();

    const parent = await new User({
      firstName: "Khadija",
      lastName: "Saeed",
      email: "khadija@example.com",
      password: "parentpass123",
      role: "Parent",
      childrenIds: [student._id],
    }).save();

    const leaveRequest = new LeaveRequest({
      student: student._id,
      parent: parent._id,
      teacher: teacher._id,
      date: new Date("2026-05-15"),
      reason: "Family emergency",
    });

    const saved = await leaveRequest.save();
    expect(saved._id).toBeDefined();
    expect(saved.status).toBe("Pending");
    expect(saved.reason).toBe("Family emergency");
  });

  it("rejects leave request without required fields", async () => {
    const leaveRequest = new LeaveRequest({
      reason: "Sick",
    });

    await expect(leaveRequest.save()).rejects.toThrow(
      /Student is required|Parent is required|Teacher is required|Date is required/,
    );
  });

  it("rejects invalid status", async () => {
    const leaveRequest = new LeaveRequest({
      student: new mongoose.Types.ObjectId(),
      parent: new mongoose.Types.ObjectId(),
      teacher: new mongoose.Types.ObjectId(),
      date: new Date(),
      reason: "Test",
      status: "Invalid",
    });

    await expect(leaveRequest.save()).rejects.toThrow(
      /Status must be Pending, Approved, or Rejected/,
    );
  });
});
