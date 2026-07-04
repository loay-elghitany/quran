const Badge = require("../models/badge.model");
const Challenge = require("../models/challenge.model");
const StoreConfig = require("../models/storeConfig.model");
const Group = require("../models/group.model");
const User = require("../models/user.model");

// ============ BADGE OPERATIONS ============

const createBadge = async (req, res) => {
  try {
    const { name, icon, description, pointsReward, maxPerMonth } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "اسم الوسام مطلوب." });
    }

    const badge = new Badge({
      name,
      icon: icon || "default-icon",
      description: description || "",
      pointsReward: pointsReward || 0,
      maxPerMonth: maxPerMonth || 5,
    });

    const saved = await badge.save();
    res.status(201).json({ message: "تم إنشاء الوسام بنجاح.", badge: saved });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const getBadges = async (req, res) => {
  try {
    const badges = await Badge.find().sort({ createdAt: -1 });
    res.json({ badges });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const updateBadge = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, description, pointsReward, maxPerMonth } = req.body;

    const badge = await Badge.findById(id);
    if (!badge) {
      return res
        .status(404)
        .json({ success: false, message: "الوسام غير موجود." });
    }

    badge.name = name || badge.name;
    badge.icon = icon || badge.icon;
    badge.description = description || badge.description;
    if (pointsReward !== undefined) badge.pointsReward = pointsReward;
    if (maxPerMonth !== undefined) badge.maxPerMonth = maxPerMonth;

    const updated = await badge.save();
    res.json({ message: "تم تحديث الوسام بنجاح.", badge: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const deleteBadge = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Badge.findByIdAndDelete(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "الوسام غير موجود." });
    }

    res.json({ message: "تم حذف الوسام بنجاح." });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

// ============ CHALLENGE OPERATIONS ============

const createChallenge = async (req, res) => {
  try {
    const { title, groupId, targetPoints, rewardDescription, deadline } =
      req.body;

    if (!title || !groupId || !targetPoints) {
      return res.status(400).json({
        success: false,
        message: "العنوان والمجموعة والحد الأقصى للنقاط مطلوبون.",
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "المجموعة غير موجودة." });
    }

    const challenge = new Challenge({
      title,
      groupId,
      targetPoints,
      rewardDescription: rewardDescription || "",
      deadline: deadline ? new Date(deadline) : null,
    });

    const saved = await challenge.save();
    res
      .status(201)
      .json({ message: "تم إنشاء التحدي بنجاح.", challenge: saved });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const getChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find()
      .populate("groupId", "name")
      .sort({ createdAt: -1 });
    res.json({ challenges });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const getChallengesByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const challenges = await Challenge.find({ groupId })
      .populate("groupId", "name")
      .sort({ createdAt: -1 });
    res.json({ challenges });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const updateChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      targetPoints,
      currentPoints,
      rewardDescription,
      deadline,
      isCompleted,
    } = req.body;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res
        .status(404)
        .json({ success: false, message: "التحدي غير موجود." });
    }

    challenge.title = title || challenge.title;
    if (targetPoints !== undefined) challenge.targetPoints = targetPoints;
    if (currentPoints !== undefined) challenge.currentPoints = currentPoints;
    challenge.rewardDescription =
      rewardDescription || challenge.rewardDescription;
    if (deadline !== undefined)
      challenge.deadline = deadline ? new Date(deadline) : null;
    if (isCompleted !== undefined) {
      challenge.isCompleted = isCompleted;
      if (isCompleted && !challenge.completedAt) {
        challenge.completedAt = new Date();
      }
    }

    const updated = await challenge.save();
    res.json({ message: "تم تحديث التحدي بنجاح.", challenge: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const deleteChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Challenge.findByIdAndDelete(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "التحدي غير موجود." });
    }

    res.json({ message: "تم حذف التحدي بنجاح." });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

// ============ DIRECT STUDENT REWARDS ============

const grantPointsToAll = async (req, res) => {
  try {
    const { points } = req.body;
    const parsedPoints = Number(points);

    if (!Number.isInteger(parsedPoints) || parsedPoints <= 0) {
      return res.status(400).json({
        success: false,
        message: "يرجى إدخال عدد صحيح موجب للنقاط.",
      });
    }

    await User.updateMany(
      { role: "Student" },
      { $inc: { points: parsedPoints } },
    );

    res.json({
      success: true,
      message: `تم منح ${parsedPoints} نقطة لجميع الطلاب بنجاح.`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const grantPointsToStudent = async (req, res) => {
  try {
    const { studentId, points } = req.body;
    const parsedPoints = Number(points);

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "يرجى اختيار طالب أولاً.",
      });
    }

    if (!Number.isInteger(parsedPoints) || parsedPoints <= 0) {
      return res.status(400).json({
        success: false,
        message: "يرجى إدخال عدد صحيح موجب للنقاط.",
      });
    }

    const updatedStudent = await User.findByIdAndUpdate(
      studentId,
      { $inc: { points: parsedPoints } },
      { new: true },
    );

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: "الطالب غير موجود.",
      });
    }

    res.json({
      success: true,
      message: `تم منح ${parsedPoints} نقطة للطالب بنجاح.`,
      student: updatedStudent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

// ============ MYSTERY BOX CONFIG OPERATIONS ============

const getOrCreateMysteryBoxConfig = async (req, res) => {
  try {
    let config = await StoreConfig.findOne({ itemType: "MysteryBox" });

    if (!config) {
      config = new StoreConfig({
        name: "Mystery Box",
        itemType: "MysteryBox",
        cost: 100,
        description: "افتح صندوق الأسرار واكشف مفاجأة!",
        possibleRewards: [
          { text: "10 نقاط", probability: 0.25 },
          { text: "50 نقطة", probability: 0.2 },
          { text: "100 نقطة", probability: 0.15 },
          { text: "قلم معدني", probability: 0.2 },
          { text: "كتاب قرآن", probability: 0.2 },
        ],
        isActive: true,
      });
      await config.save();
    }

    res.json({ config });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً." });
  }
};

const updateMysteryBoxConfig = async (req, res) => {
  try {
    const { cost, description, possibleRewards, isActive } = req.body;

    let config = await StoreConfig.findOne({ itemType: "MysteryBox" });

    if (!config) {
      config = new StoreConfig({ itemType: "MysteryBox" });
    }

    if (cost !== undefined) config.cost = cost;
    if (description !== undefined) config.description = description;
    if (Array.isArray(possibleRewards))
      config.possibleRewards = possibleRewards;
    if (isActive !== undefined) config.isActive = isActive;

    const updated = await config.save();
    res.json({
      message: "تم تحديث إعدادات صندوق الأسرار بنجاح.",
      config: updated,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً." });
  }
};

module.exports = {
  createBadge,
  getBadges,
  updateBadge,
  deleteBadge,
  createChallenge,
  getChallenges,
  getChallengesByGroup,
  updateChallenge,
  deleteChallenge,
  grantPointsToAll,
  grantPointsToStudent,
  getOrCreateMysteryBoxConfig,
  updateMysteryBoxConfig,
};
