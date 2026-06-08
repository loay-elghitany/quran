const Curriculum = require("../models/curriculum.model");
const TeacherProgress = require("../models/teacherProgress.model");
const User = require("../models/user.model");

const getTeacherCurriculums = async (req, res) => {
  try {
    const curriculums = await Curriculum.find({ target: "teacher" }).sort({
      createdAt: -1,
    });
    res.json({ curriculums });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message:
          "ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، ط¬ظ„ط¨ ط§ظ„ظ…ظ†ط§ظ‡ط¬ ط§ظ„طھط¯ط±ظٹط¨ظٹط©.",
      });
  }
};

const getCurrentForTeacher = async (req, res) => {
  try {
    const { curriculumId } = req.params;
    const teacherId = req.user._id;

    const curriculum = await Curriculum.findById(curriculumId);
    if (!curriculum || curriculum.target !== "teacher") {
      return res
        .status(404)
        .json({
          success: false,
          message: "ط§ظ„ظ…ظ†ظ‡ط¬ ط§ظ„طھط¯ط±ظٹط¨ظٹ ط؛ظٹط± ظ…ظˆط¬ظˆط¯.",
        });
    }

    let progress = await TeacherProgress.findOne({ teacherId, curriculumId });
    if (!progress) {
      progress = new TeacherProgress({ teacherId, curriculumId });
      await progress.save();
    }

    const index = Math.max(
      0,
      Math.min(progress.currentLessonIndex, curriculum.lessons.length - 1),
    );
    const lesson = curriculum.lessons[index] || null;

    res.json({
      progress,
      curriculum,
      lesson,
      currentLessonIndex: index,
      totalLessons: curriculum.lessons.length,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، ط¬ظ„ط¨ ط­ط§ظ„ط© ط§ظ„طھط¯ط±ظٹط¨.",
      });
  }
};

const completeLesson = async (req, res) => {
  try {
    const { curriculumId } = req.params;
    const teacherId = req.user._id;

    const curriculum = await Curriculum.findById(curriculumId);
    if (!curriculum || curriculum.target !== "teacher") {
      return res
        .status(404)
        .json({
          success: false,
          message: "ط§ظ„ظ…ظ†ظ‡ط¬ ط§ظ„طھط¯ط±ظٹط¨ظٹ ط؛ظٹط± ظ…ظˆط¬ظˆط¯.",
        });
    }

    let progress = await TeacherProgress.findOne({ teacherId, curriculumId });
    if (!progress) {
      progress = new TeacherProgress({ teacherId, curriculumId });
    }

    if (progress.currentLessonIndex >= curriculum.lessons.length - 1) {
      progress.completedAt = new Date();
      await progress.save();
      return res
        .status(200)
        .json({
          message:
            "ظ„ظ‚ط¯ ط£ظƒظ…ظ„طھ ط§ظ„ط­ظ‚ظٹط¨ط© ط§ظ„طھط¯ط±ظٹط¨ظٹط© ط¨ط§ظ„ظپط¹ظ„.",
          progress,
        });
    }

    progress.currentLessonIndex += 1;
    if (progress.currentLessonIndex >= curriculum.lessons.length) {
      progress.completedAt = new Date();
    }

    await progress.save();

    // reward teacher
    await User.findByIdAndUpdate(teacherId, { $inc: { points: 50 } });

    res.json({
      message: "طھظ… ط¥طھظ…ط§ظ… ط§ظ„ط¯ط±ط³ ظˆط³ظڈط¬ظ‘ظ„طھ 50 ظ†ظ‚ط·ط©!",
      progress,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، ط¥طھظ…ط§ظ… ط§ظ„ط¯ط±ط³.",
      });
  }
};

module.exports = {
  getTeacherCurriculums,
  getCurrentForTeacher,
  completeLesson,
};
