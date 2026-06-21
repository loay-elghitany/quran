const mongoose = require("mongoose");

const { Schema } = mongoose;

const SystemSettingsSchema = new Schema(
  {
    attendancePoints: { type: Number, default: 5 },
    excusedAbsencePoints: { type: Number, default: 0 },
    unexcusedAbsencePoints: { type: Number, default: 0 },
    gradeExcellentPoints: { type: Number, default: 10 },
    gradeVeryGoodPoints: { type: Number, default: 8 },
    gradeGoodPoints: { type: Number, default: 5 },
    gradeAcceptablePoints: { type: Number, default: 2 },
    errorPenaltyMultiplier: { type: Number, default: 1 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SystemSettings", SystemSettingsSchema);
