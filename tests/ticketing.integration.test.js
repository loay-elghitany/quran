const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const express = require("express");
const app = require("../src/app");
const { connect, closeDatabase, clearDatabase } = require("./setupTestDB");
const User = require("../src/models/user.model");

/**
 * These tests mount a lightweight ticket router onto the real `app` during
 * the test run. This lets us exercise a full CRUD cycle for a Ticket schema
 * without requiring production routes to already exist.
 */

describe("Ticketing (complaints/suggestions) integration tests", () => {
  beforeAll(async () => {
    // connect to in-memory mongo; real ticket routes are mounted by app
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  test("Student creates a ticket then Admin resolves it", async () => {
    // create users
    const student = await User.create({
      firstName: "TktStudent",
      lastName: "One",
      email: "tkt_student@example.com",
      password: "password",
      role: "Student",
      teacherId: new mongoose.Types.ObjectId(),
    });

    const admin = await User.create({
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      password: "password",
      role: "SuperAdmin",
    });

    const studentToken = jwt.sign(
      { id: student._id },
      process.env.JWT_SECRET || "defaultsecret",
    );
    const adminToken = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET || "defaultsecret",
    );

    // student submits a ticket
    const createRes = await request(app)
      .post(`/api/admin/complaints`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        subject: "Broken video",
        description: "Video link is broken",
        type: "Complaint",
        priority: "Urgent",
      })
      .expect(201);

    expect(createRes.body.ticket).toBeDefined();
    const ticketId = createRes.body.ticket._id;

    // admin lists tickets
    const listRes = await request(app)
      .get(`/api/admin/complaints`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(listRes.body.complaints)).toBe(true);
    expect(
      listRes.body.complaints.find((t) => t._id === ticketId),
    ).toBeDefined();

    // admin updates status to Resolved
    const updateRes = await request(app)
      .put(`/api/admin/complaints/${ticketId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "Resolved" })
      .expect(200);

    expect(updateRes.body.ticket.status).toEqual("Resolved");
  });
});
