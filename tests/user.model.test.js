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

describe("User model", () => {
  it("creates a valid SuperAdmin user", async () => {
    const admin = new User({
      firstName: "Amina",
      lastName: "Khalid",
      email: "amina@example.com",
      password: "strongpass123",
      role: "SuperAdmin",
    });

    const saved = await admin.save();
    expect(saved._id).toBeDefined();
    expect(saved.role).toBe("SuperAdmin");
    expect(saved.fullName).toBe("Amina Khalid");
  });

  it("creates a Teacher and Student user with relationships", async () => {
    const teacher = await new User({
      firstName: "Yusuf",
      lastName: "Ali",
      email: "yusuf@example.com",
      password: "teacherpass123",
      role: "Teacher",
    }).save();

    const student = new User({
      firstName: "Fatima",
      lastName: "Noor",
      email: "fatima@example.com",
      password: "studentpass123",
      role: "Student",
      teacherId: teacher._id,
    });

    const group = await new Group({
      name: "Al-Furqan Group",
      teacherId: teacher._id,
      studentIds: [student._id],
    }).save();

    student.assignedGroups = [group._id];
    const savedStudent = await student.save();

    expect(savedStudent.role).toBe("Student");
    expect(savedStudent.teacherId.toString()).toBe(teacher._id.toString());
    expect(savedStudent.assignedGroups[0].toString()).toBe(
      group._id.toString(),
    );
  });

  it("creates a Parent user linked to multiple students", async () => {
    const studentOne = await new User({
      firstName: "Hassan",
      lastName: "Mahmoud",
      email: "hassan@example.com",
      password: "studentpass123",
      role: "Student",
      teacherId: new mongoose.Types.ObjectId(),
      assignedGroups: [new mongoose.Types.ObjectId()],
    }).save();

    const studentTwo = await new User({
      firstName: "Aisha",
      lastName: "Salim",
      email: "aisha@example.com",
      password: "studentpass123",
      role: "Student",
      teacherId: new mongoose.Types.ObjectId(),
      assignedGroups: [new mongoose.Types.ObjectId()],
    }).save();

    const parent = await new User({
      firstName: "Khadija",
      lastName: "Saeed",
      email: "khadija@example.com",
      password: "parentpass123",
      role: "Parent",
      childrenIds: [studentOne._id, studentTwo._id],
    }).save();

    expect(parent.role).toBe("Parent");
    expect(parent.childrenIds).toHaveLength(2);
    expect(parent.childrenIds.map((id) => id.toString())).toEqual([
      studentOne._id.toString(),
      studentTwo._id.toString(),
    ]);
  });

  it("rejects invalid role values", async () => {
    const invalidUser = new User({
      firstName: "Invalid",
      lastName: "User",
      email: "invalid@example.com",
      password: "invalidpass123",
      role: "Guest",
    });

    await expect(invalidUser.save()).rejects.toThrow(
      /Role must be SuperAdmin, Teacher, Student, or Parent/,
    );
  });

  it("rejects Student without teacher and group assignment", async () => {
    const student = new User({
      firstName: "Zayd",
      lastName: "Ibrahim",
      email: "zayd@example.com",
      password: "studentpass123",
      role: "Student",
    });

    await expect(student.save()).rejects.toThrow(
      /Student must have an assigned teacher|Student must be assigned to a group/,
    );
  });

  it("hashes password on save", async () => {
    const user = new User({
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      password: "plainpassword",
      role: "SuperAdmin",
    });

    const saved = await user.save();
    expect(saved.password).not.toBe("plainpassword");
    expect(await saved.comparePassword("plainpassword")).toBe(true);
    expect(await saved.comparePassword("wrongpassword")).toBe(false);
  });
});
