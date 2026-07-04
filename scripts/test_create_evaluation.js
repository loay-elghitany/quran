require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const fetch = global.fetch || require("node-fetch");
const FormData = global.FormData || require("form-data");

const User = require("../src/models/user.model");
const Group = require("../src/models/group.model");

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || "changeme";
const API_BASE = process.env.API_BASE || "http://localhost:5001/api";

async function main() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI not set");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // create or find teacher
  let teacher = await User.findOne({ email: "test.teacher@example.com" });
  if (!teacher) {
    teacher = new User({
      firstName: "Test",
      lastName: "Teacher",
      email: "test.teacher@example.com",
      password: "pass1234",
      role: "Teacher",
    });
    await teacher.save();
    console.log("Created teacher", teacher._id.toString());
  }

  // create or find student
  let student = await User.findOne({ email: "test.student@example.com" });
  if (!student) {
    student = new User({
      firstName: "Test",
      lastName: "Student",
      email: "test.student@example.com",
      password: "pass1234",
      role: "Student",
      teacherId: teacher._id,
      points: 0,
    });
    await student.save();
    console.log("Created student", student._id.toString());
  }

  // create or find group
  let group = await Group.findOne({ name: "Test Group" });
  if (!group) {
    group = new Group({
      name: "Test Group",
      teacherId: teacher._id,
      studentIds: [student._id],
    });
    await group.save();
    console.log("Created group", group._id.toString());
  } else {
    // ensure student is in group
    if (!group.studentIds.map(String).includes(String(student._id))) {
      group.studentIds.push(student._id);
      await group.save();
    }
  }

  // generate JWT for teacher
  const token = jwt.sign({ id: teacher._id, role: "Teacher" }, JWT_SECRET, {
    expiresIn: "24h",
  });
  console.log("Generated teacher token");

  // Prepare evaluation payload
  const form = new FormData();
  form.append("studentId", student._id.toString());
  form.append("groupId", group._id.toString());
  form.append("attendanceStatus", "حاضر");
  form.append("memorizationFrom", "الفاتحة");
  form.append("memorizationTo", "البقرة");
  form.append("revisionFrom", "آل عمران");
  form.append("revisionTo", "النساء");
  form.append("memorizationPagesCount", "2"); // 2 pages -> +20
  form.append("revisionPagesCount", "3"); // 3 pages -> +15
  form.append("mistakes", "4"); // -4
  form.append("grade", "7"); // grade 7 -> 7*3 = 21
  form.append("notes", "Test evaluation via script");

  // send request
  console.log("Posting evaluation to API...");
  const res = await fetch(`${API_BASE}/teacher/evaluations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  console.log("Response status:", res.status);
  console.log("Response body:", data);

  // fetch student to see updated points
  const updatedStudent = await User.findById(student._id).lean();
  console.log("Student points after evaluation:", updatedStudent.points);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
