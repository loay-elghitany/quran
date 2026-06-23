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

    res.json({
      settings: {
        attendancePoints: settings.attendancePoints ?? 5,
        excusedAbsencePoints: settings.excusedAbsencePoints ?? 0,
        unexcusedAbsencePoints: settings.unexcusedAbsencePoints ?? 0,
        score_1: settings.score_1 ?? 1,
        score_2: settings.score_2 ?? 2,
        score_3: settings.score_3 ?? 3,
        score_4: settings.score_4 ?? 4,
        score_5: settings.score_5 ?? 5,
        score_6: settings.score_6 ?? 6,
        score_7: settings.score_7 ?? 7,
        score_8: settings.score_8 ?? 8,
        score_9: settings.score_9 ?? 9,
        score_10: settings.score_10 ?? 10,
        errorPenaltyMultiplier: settings.errorPenaltyMultiplier ?? 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
