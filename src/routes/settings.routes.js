const express = require("express");
const SystemSettings = require("../models/systemSettings.model");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/gamification", async (req, res, next) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
