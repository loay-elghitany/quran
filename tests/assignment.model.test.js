const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let User;
let Group;
let Assignment;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  User = require("../src/models/user.model");
  Group = require("../src/models/group.model");
  Assignment = require("../src/models/assignment.model");
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

describe("Assignment model", () => {
  it("creates a valid assignment with all fields", async () => {
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

    const assignment = new Assignment({
      student: student._id,
      teacher: teacher._id,
      date: new Date("2026-05-12"),
      attendanceStatus: "Present",
      newMemorization: {
        startVerse: 1,
        endVerse: 5,
        surahName: "Al-Fatiha",
      },
      reviewPast: {
        startVerse: 6,
        endVerse: 10,
        surahName: "Al-Baqarah",
      },
      evaluationTag: "Excellent",
      teacherNote: "Great recitation!",
      voiceNoteUrl: "https://example.com/voice.mp3",
    });

    const saved = await assignment.save();
    expect(saved._id).toBeDefined();
    expect(saved.attendanceStatus).toBe("Present");
    expect(saved.evaluationTag).toBe("Excellent");
    expect(saved.newMemorization.surahName).toBe("Al-Fatiha");
  });

  it("rejects assignment without required fields", async () => {
    const assignment = new Assignment({
      date: new Date(),
    });

    await expect(assignment.save()).rejects.toThrow(
      /Student is required|Teacher is required/,
    );
  });

  it("rejects invalid attendanceStatus", async () => {
    const assignment = new Assignment({
      student: new mongoose.Types.ObjectId(),
      teacher: new mongoose.Types.ObjectId(),
      date: new Date(),
      attendanceStatus: "Late",
    });

    await expect(assignment.save()).rejects.toThrow(
      /Attendance status must be Present, Absent, or Excused/,
    );
  });

  it("rejects invalid evaluationTag", async () => {
    const assignment = new Assignment({
      student: new mongoose.Types.ObjectId(),
      teacher: new mongoose.Types.ObjectId(),
      date: new Date(),
      attendanceStatus: "Present",
      evaluationTag: "Okay",
    });

    await expect(assignment.save()).rejects.toThrow(
      /Evaluation tag must be Excellent, Good, Needs Review, or Not Done/,
    );
  });
});
