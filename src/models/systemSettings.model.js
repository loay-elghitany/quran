const mongoose = require("mongoose");

const { Schema } = mongoose;

const SystemSettingsSchema = new Schema(
  {
    attendancePoints: { type: Number, default: 5 },
    excusedAbsencePoints: { type: Number, default: 0 },
    unexcusedAbsencePoints: { type: Number, default: 0 },
    score_1: { type: Number, default: 1 },
    score_2: { type: Number, default: 2 },
    score_3: { type: Number, default: 3 },
    score_4: { type: Number, default: 4 },
    score_5: { type: Number, default: 5 },
    score_6: { type: Number, default: 6 },
    score_7: { type: Number, default: 7 },
    score_8: { type: Number, default: 8 },
    score_9: { type: Number, default: 9 },
    score_10: { type: Number, default: 10 },
    gradeExcellentPoints: { type: Number, default: 10 },
    gradeVeryGoodPoints: { type: Number, default: 8 },
    gradeGoodPoints: { type: Number, default: 5 },
    gradeAcceptablePoints: { type: Number, default: 2 },
    errorPenaltyMultiplier: { type: Number, default: 1 },
    memorizationPageBonus: { type: Number, default: 10 },
    revisionPageBonus: { type: Number, default: 5 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SystemSettings", SystemSettingsSchema);
