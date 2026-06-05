const express = require("express");
const { getAnnouncements } = require("../controllers/announcement.controller");

const router = express.Router();

router.get("/", getAnnouncements);

module.exports = router;
