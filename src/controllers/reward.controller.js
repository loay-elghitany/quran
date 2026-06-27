const Reward = require("../models/reward.model");
const Redemption = require("../models/redemption.model");
const Evaluation = require("../models/evaluation.model");
const User = require("../models/user.model");

const ensureRewardQuantityDefaults = async () => {
  await Reward.updateMany(
    { $or: [{ quantity: { $exists: false } }, { quantity: null }] },
    { $set: { quantity: 1 } },
  );
};

const createReward = async (req, res) => {
  try {
    const {
      name,
      pointsRequired,
      quantity,
      image,
      imageUrl,
      icon,
      description,
    } = req.body;
    const imageValue = image || imageUrl || "";

    if (!name || pointsRequired == null) {
      return res
        .status(400)
        .json({ message: "اسم المكافأة ونقاط المكافأة مطلوبان." });
    }

    const reward = new Reward({
      name,
      pointsRequired,
      quantity,
      image: imageValue,
      imageUrl: imageValue,
      icon,
      description,
    });
    const savedReward = await reward.save();

    res
      .status(201)
      .json({ message: "تم إنشاء المكافأة بنجاح.", reward: savedReward });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const getRewards = async (req, res) => {
  try {
    await ensureRewardQuantityDefaults();
    const rewards = await Reward.find().sort({ pointsRequired: -1 });
    res.json({ rewards });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const updateReward = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      pointsRequired,
      quantity,
      image,
      imageUrl,
      icon,
      description,
    } = req.body;
    const imageValue = image || imageUrl;

    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name;
    if (pointsRequired !== undefined)
      updatePayload.pointsRequired = pointsRequired;
    if (quantity !== undefined) updatePayload.quantity = quantity;
    if (icon !== undefined) updatePayload.icon = icon;
    if (description !== undefined) updatePayload.description = description;
    if (imageValue !== undefined) {
      updatePayload.image = imageValue;
      updatePayload.imageUrl = imageValue;
    }

    const reward = await Reward.findByIdAndUpdate(id, updatePayload, {
      new: true,
    });

    if (!reward) {
      return res
        .status(404)
        .json({ success: false, message: "المكافأة غير موجودة." });
    }

    res.json({ message: "تم تحديث المكافأة بنجاح.", reward });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const deleteReward = async (req, res) => {
  try {
    const { id } = req.params;
    const reward = await Reward.findByIdAndDelete(id);
    if (!reward) {
      return res
        .status(404)
        .json({ success: false, message: "المكافأة غير موجودة." });
    }
    res.json({ message: "تم حذف المكافأة بنجاح." });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
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
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const updateRedemptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "الحالة غير صالحة." });
    }

    const redemption = await Redemption.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    )
      .populate("studentId", "firstName lastName email")
      .populate("rewardId", "name pointsRequired");

    if (!redemption) {
      return res
        .status(404)
        .json({ success: false, message: "الطلب غير موجود." });
    }

    res.json({ message: "تم تحديث حالة الطلب بنجاح.", redemption });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const getStudentRewards = async (req, res) => {
  try {
    const studentId = req.user._id;

    const student = await User.findById(studentId).select("points");
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "الطالب غير موجود." });
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

    await ensureRewardQuantityDefaults();
    const rewards = await Reward.find().sort({ pointsRequired: -1 });
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
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const redeemReward = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { rewardId } = req.body;

    if (!rewardId) {
      return res
        .status(400)
        .json({ success: false, message: "المكافأة مطلوبة." });
    }

    const reward = await Reward.findById(rewardId);
    if (!reward) {
      return res
        .status(404)
        .json({ success: false, message: "المكافأة غير موجودة." });
    }

    const student = await User.findById(studentId).select("points");
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "الطالب غير موجود." });
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

    if ((reward.quantity ?? 1) <= 0) {
      return res.status(400).json({
        success: false,
        message: "عذراً، لقد نفدت الكمية المتاحة من هذه المكافأة.",
      });
    }

    if (availablePoints < reward.pointsRequired) {
      return res.status(400).json({
        success: false,
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
    const updatedReward = await Reward.findOneAndUpdate(
      { _id: rewardId, quantity: { $gt: 0 } },
      { $inc: { quantity: -1 } },
      { new: true },
    );

    if (!updatedReward) {
      await Redemption.findByIdAndDelete(savedRedemption._id);
      return res.status(400).json({
        success: false,
        message: "عذراً، لقد نفدت الكمية المتاحة من هذه المكافأة.",
      });
    }

    res.status(201).json({
      message: "تم إنشاء طلب الاستبدال بنجاح.",
      redemption: savedRedemption,
      availablePoints: availablePoints - reward.pointsRequired,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
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
