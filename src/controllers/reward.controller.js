const Reward = require("../models/reward.model");
const Redemption = require("../models/redemption.model");
const Evaluation = require("../models/evaluation.model");
const User = require("../models/user.model");

const createReward = async (req, res) => {
  try {
    const { name, pointsRequired, imageUrl, icon, description } = req.body;

    if (!name || pointsRequired == null) {
      return res
        .status(400)
        .json({ message: "اسم المكافأة والنقاط المطلوبة مطلوبان." });
    }

    const reward = new Reward({
      name,
      pointsRequired,
      imageUrl,
      icon,
      description,
    });
    const savedReward = await reward.save();

    res
      .status(201)
      .json({ message: "تم إنشاء المكافأة بنجاح.", reward: savedReward });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ في الخادم." });
  }
};

const getRewards = async (req, res) => {
  try {
    const rewards = await Reward.find();
    res.json({ rewards });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ في تحميل المكافآت." });
  }
};

const updateReward = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, pointsRequired, imageUrl, icon, description } = req.body;

    const reward = await Reward.findByIdAndUpdate(
      id,
      { name, pointsRequired, imageUrl, icon, description },
      { new: true },
    );

    if (!reward) {
      return res.status(404).json({ message: "المكافأة غير موجودة." });
    }

    res.json({ message: "تم تحديث المكافأة.", reward });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ في الخادم." });
  }
};

const deleteReward = async (req, res) => {
  try {
    const { id } = req.params;
    const reward = await Reward.findByIdAndDelete(id);
    if (!reward) {
      return res.status(404).json({ message: "المكافأة غير موجودة." });
    }
    res.json({ message: "تم حذف المكافأة." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ في الخادم." });
  }
};

const getRedemptions = async (req, res) => {
  try {
    const redemptions = await Redemption.find()
      .sort({ date: -1 })
      .populate("studentId", "firstName lastName email")
      .populate("rewardId", "name pointsRequired");
    res.json({ redemptions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ في تحميل طلبات الاستبدال." });
  }
};

const updateRedemptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "الحالة غير صحيحة." });
    }

    const redemption = await Redemption.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    )
      .populate("studentId", "firstName lastName email")
      .populate("rewardId", "name pointsRequired");

    if (!redemption) {
      return res.status(404).json({ message: "طلب الاستبدال غير موجود." });
    }

    res.json({ message: "تم تحديث حالة الطلب.", redemption });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ في الخادم." });
  }
};

const getStudentRewards = async (req, res) => {
  try {
    const studentId = req.user._id;

    const student = await User.findById(studentId).select("points");
    if (!student) {
      return res.status(404).json({ message: "الطالب غير موجود." });
    }

    const aggregatePoints = await Evaluation.aggregate([
      { $match: { studentId } },
      { $group: { _id: null, totalPoints: { $sum: "$earnedPoints" } } },
    ]);
    const evaluationPoints = aggregatePoints[0]?.totalPoints || 0;
    const badgePoints = student.points || 0;
    const totalPoints = evaluationPoints + badgePoints;

    const reservedAggregation = await Redemption.aggregate([
      {
        $match: {
          studentId,
          status: { $in: ["pending", "approved"] },
        },
      },
      {
        $group: {
          _id: null,
          reservedPoints: { $sum: "$pointsRequired" },
        },
      },
    ]);
    const reservedPoints = reservedAggregation[0]?.reservedPoints || 0;
    const availablePoints = totalPoints - reservedPoints;

    const rewards = await Reward.find();
    const redemptions = await Redemption.find({ studentId })
      .sort({ date: -1 })
      .populate("rewardId", "name pointsRequired");

    res.json({
      availablePoints,
      totalPoints,
      reservedPoints,
      badgePoints,
      rewards,
      redemptions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ في تحميل بيانات المكافآت." });
  }
};

const redeemReward = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { rewardId } = req.body;

    if (!rewardId) {
      return res.status(400).json({ message: "المكافأة مطلوبة." });
    }

    const reward = await Reward.findById(rewardId);
    if (!reward) {
      return res.status(404).json({ message: "المكافأة غير موجودة." });
    }

    const student = await User.findById(studentId).select("points");
    if (!student) {
      return res.status(404).json({ message: "الطالب غير موجود." });
    }

    const aggregatePoints = await Evaluation.aggregate([
      { $match: { studentId } },
      { $group: { _id: null, totalPoints: { $sum: "$earnedPoints" } } },
    ]);
    const evaluationPoints = aggregatePoints[0]?.totalPoints || 0;
    const badgePoints = student.points || 0;
    const totalPoints = evaluationPoints + badgePoints;

    const reservedAggregation = await Redemption.aggregate([
      {
        $match: {
          studentId,
          status: { $in: ["pending", "approved"] },
        },
      },
      {
        $group: {
          _id: null,
          reservedPoints: { $sum: "$pointsRequired" },
        },
      },
    ]);
    const reservedPoints = reservedAggregation[0]?.reservedPoints || 0;
    const availablePoints = totalPoints - reservedPoints;

    if (availablePoints < reward.pointsRequired) {
      return res.status(400).json({
        message: "لا يوجد لديك نقاط كافية لطلب هذه المكافأة.",
        availablePoints,
      });
    }

    const redemption = new Redemption({
      studentId,
      rewardId,
      pointsRequired: reward.pointsRequired,
      status: "pending",
    });

    const savedRedemption = await redemption.save();
    res.status(201).json({
      message: "تم إرسال طلب استبدال النقاط بنجاح.",
      redemption: savedRedemption,
      availablePoints: availablePoints - reward.pointsRequired,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ في الخادم." });
  }
};

module.exports = {
  createReward,
  getRewards,
  updateReward,
  deleteReward,
  getRedemptions,
  updateRedemptionStatus,
  getStudentRewards,
  redeemReward,
};
