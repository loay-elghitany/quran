const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const app = require("../src/app");
const { connect, closeDatabase, clearDatabase } = require("./setupTestDB");
const User = require("../src/models/user.model");
const Badge = require("../src/models/badge.model");
const notificationService = require("../src/services/notification.service");

describe("Gamification integration tests", () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  test("Teacher awards a badge — student points increase and badge recorded", async () => {
    // create teacher and student
    const teacher = await User.create({
      firstName: "T",
      lastName: "Teacher",
      email: "t@example.com",
      password: "password",
      role: "Teacher",
    });

    const student = await User.create({
      firstName: "S",
      lastName: "Student",
      email: "s@example.com",
      password: "password",
      role: "Student",
      teacherId: teacher._id,
    });

    // create a badge worth 500 points
    const badge = await Badge.create({
      name: "Crown",
      icon: "👑",
      description: "Special crown",
      pointsReward: 500,
      maxPerMonth: 5,
    });

    const teacherToken = jwt.sign(
      { id: teacher._id },
      process.env.JWT_SECRET || "defaultsecret",
    );

    // award the badge
    const res = await request(app)
      .post(`/api/teacher/students/${student._id}/award-badge`)
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ badgeId: badge._id })
      .expect(200);

    expect(res.body.message).toMatch(/تم منح الوسام/);

    const updatedStudent = await User.findById(student._id);
    expect(updatedStudent.points).toBeGreaterThanOrEqual(500);
    expect(updatedStudent.badges.length).toBeGreaterThanOrEqual(1);
    expect(String(updatedStudent.badges[0].badgeId)).toEqual(String(badge._id));
  });

  test("Awarding points unlocks restricted avatar via student avatar endpoint", async () => {
    const teacher = await User.create({
      firstName: "T2",
      lastName: "Teacher",
      email: "t2@example.com",
      password: "password",
      role: "Teacher",
    });

    const student = await User.create({
      firstName: "S2",
      lastName: "Student",
      email: "s2@example.com",
      password: "password",
      role: "Student",
      teacherId: teacher._id,
    });

    const crownBadge = await Badge.create({
      name: "Crown500",
      icon: "👑",
      description: "Big crown",
      pointsReward: 500,
      maxPerMonth: 1,
    });

    const teacherToken = jwt.sign(
      { id: teacher._id },
      process.env.JWT_SECRET || "defaultsecret",
    );

    // award crown to student
    await request(app)
      .post(`/api/teacher/students/${student._id}/award-badge`)
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ badgeId: crownBadge._id })
      .expect(200);

    // student should now have >=500 points
    const studentToken = jwt.sign(
      { id: student._id },
      process.env.JWT_SECRET || "defaultsecret",
    );

    // attempt to set a locked avatar that requires 500 points
    const crownUrl = "https://api.dicebear.com/6.x/pixel-art/svg?seed=Crown";

    const avatarRes = await request(app)
      .patch(`/api/student/avatar`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ avatar: crownUrl })
      .expect(200);

    expect(avatarRes.body.avatar).toEqual(crownUrl);
  });

  test("Notifications are mocked — create assignment calls sendWhatsAppMessage but does not send real message", async () => {
    // create teacher, student, parent
    const teacher = await User.create({
      firstName: "T3",
      lastName: "Teacher",
      email: "t3@example.com",
      password: "password",
      role: "Teacher",
    });

    const student = await User.create({
      firstName: "S3",
      lastName: "Student",
      email: "s3@example.com",
      password: "password",
      role: "Student",
      teacherId: teacher._id,
    });

    const parent = await User.create({
      firstName: "P",
      lastName: "Parent",
      email: "p@example.com",
      password: "password",
      role: "Parent",
      childrenIds: [student._id],
      phone: "+15550001111",
    });

    const spy = jest
      .spyOn(notificationService, "sendWhatsAppMessage")
      .mockImplementation(() => true);

    const teacherToken = jwt.sign(
      { id: teacher._id },
      process.env.JWT_SECRET || "defaultsecret",
    );

    const assignmentPayload = {
      student: student._id,
      date: new Date(),
      attendanceStatus: "Present",
      newMemorization: { surahName: "Al-Fatiha", startVerse: 1, endVerse: 7 },
      reviewPast: { surahName: "Al-Baqarah", startVerse: 1, endVerse: 3 },
      evaluationTag: "Excellent",
    };

    await request(app)
      .post(`/api/teacher/assignments`)
      .set("Authorization", `Bearer ${teacherToken}`)
      .send(assignmentPayload)
      .expect(201);

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
