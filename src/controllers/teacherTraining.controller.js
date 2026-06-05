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
    res.status(500).json({ message: "حدث خطأ أثناء جلب المناهج التدريبية." });
  }
};

const getCurrentForTeacher = async (req, res) => {
  try {
    const { curriculumId } = req.params;
    const teacherId = req.user._id;

    const curriculum = await Curriculum.findById(curriculumId);
    if (!curriculum || curriculum.target !== "teacher") {
      return res.status(404).json({ message: "المنهج التدريبي غير موجود." });
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
    res.status(500).json({ message: "حدث خطأ أثناء جلب حالة التدريب." });
  }
};

const completeLesson = async (req, res) => {
  try {
    const { curriculumId } = req.params;
    const teacherId = req.user._id;

    const curriculum = await Curriculum.findById(curriculumId);
    if (!curriculum || curriculum.target !== "teacher") {
      return res.status(404).json({ message: "المنهج التدريبي غير موجود." });
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
        .json({ message: "لقد أكملت الحقيبة التدريبية بالفعل.", progress });
    }

    progress.currentLessonIndex += 1;
    if (progress.currentLessonIndex >= curriculum.lessons.length) {
      progress.completedAt = new Date();
    }

    await progress.save();

    // reward teacher
    await User.findByIdAndUpdate(teacherId, { $inc: { points: 50 } });

    res.json({ message: "تم إتمام الدرس وسُجّلت 50 نقطة!", progress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء إتمام الدرس." });
  }
};

module.exports = {
  getTeacherCurriculums,
  getCurrentForTeacher,
  completeLesson,
};
