const Announcement = require("../models/announcement.model");

const createAnnouncement = async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      return res
        .status(400)
        .json({ success: false, message: "العنوان والرسالة مطلوبان." });
    }

    const announcement = new Announcement({ title, message });
    const savedAnnouncement = await announcement.save();

    res.status(201).json({
      message: "تم إنشاء الإعلان بنجاح.",
      announcement: savedAnnouncement,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
      });
  }
};

const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .sort({ date: -1 })
      .limit(10);
    res.json({ announcements });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
      });
  }
};

module.exports = {
  createAnnouncement,
  getAnnouncements,
};
