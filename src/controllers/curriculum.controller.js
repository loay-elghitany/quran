const path = require("path");
const Curriculum = require("../models/curriculum.model");
const Group = require("../models/group.model");
const LessonProgress = require("../models/lessonProgress.model");

const createCurriculum = async (req, res) => {
  try {
    const { name, description, lessons, target } = req.body;

    const curriculum = new Curriculum({
      name,
      description,
      target: target === "teacher" ? "teacher" : "student",
      lessons: Array.isArray(lessons) ? lessons : [],
    });

    const saved = await curriculum.save();
    res
      .status(201)
      .json({ message: "تم إنشاء المنهج بنجاح.", curriculum: saved });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const getCurriculums = async (req, res) => {
  try {
    const curriculums = await Curriculum.find().sort({ createdAt: -1 });
    res.json({ curriculums });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const getCurriculumById = async (req, res) => {
  try {
    const { id } = req.params;
    const curriculum = await Curriculum.findById(id);
    if (!curriculum) {
      return res
        .status(404)
        .json({ success: false, message: "المنهج غير موجود." });
    }
    res.json({ curriculum });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const updateCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, lessons, target } = req.body;

    const curriculum = await Curriculum.findById(id);
    if (!curriculum) {
      return res
        .status(404)
        .json({ success: false, message: "المنهج غير موجود." });
    }

    curriculum.name = name || curriculum.name;
    curriculum.description = description || curriculum.description;
    if (target && (target === "teacher" || target === "student")) {
      curriculum.target = target;
    }
    if (Array.isArray(lessons)) {
      curriculum.lessons = lessons;
    }

    const updated = await curriculum.save();
    res.json({ message: "تم تحديث المنهج بنجاح.", curriculum: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const deleteCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const curriculum = await Curriculum.findByIdAndDelete(id);
    if (!curriculum) {
      return res
        .status(404)
        .json({ success: false, message: "المنهج غير موجود." });
    }
    res.json({ message: "تم حذف المنهج بنجاح." });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const uploadLessonPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "يرجى رفع ملف PDF." });
    }

    const pdfUrl = `/uploads/pdfs/${req.file.filename}`;
    res.status(201).json({ message: "تم رفع الملف بنجاح.", pdfUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const assignCurriculumToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { curriculumId } = req.body;

    if (!curriculumId) {
      return res
        .status(400)
        .json({ success: false, message: "يرجى تحديد المنهج." });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "المجموعة غير موجودة." });
    }

    const curriculum = await Curriculum.findById(curriculumId);
    if (!curriculum) {
      return res
        .status(404)
        .json({ success: false, message: "المنهج غير موجود." });
    }

    group.curriculumId = curriculumId;
    group.currentLessonIndex = 0;
    await group.save();

    res.json({ message: "تم تعيين المنهج للمجموعة بنجاح.", group });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const getCurrentLesson = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId).populate("curriculumId");

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "المجموعة غير موجودة." });
    }

    if (!group.curriculumId) {
      return res.status(200).json({
        group,
        curriculum: null,
        lesson: null,
        currentLessonIndex: null,
        totalLessons: 0,
        message: "لم يتم تعيين منهج لهذه المجموعة بعد.",
      });
    }

    const curriculum = group.curriculumId;
    const currentIndex = Math.max(
      0,
      Math.min(group.currentLessonIndex, curriculum.lessons.length - 1),
    );
    const lesson = curriculum.lessons[currentIndex] || null;

    res.json({
      group,
      curriculum,
      lesson,
      currentLessonIndex: currentIndex,
      totalLessons: curriculum.lessons.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const advanceGroupLesson = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId).populate("curriculumId");

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "المجموعة غير موجودة." });
    }

    if (!group.curriculumId) {
      return res
        .status(400)
        .json({ message: "لم يتم تعيين منهج لهذه المجموعة بعد." });
    }

    const curriculum = group.curriculumId;
    if (group.currentLessonIndex >= curriculum.lessons.length - 1) {
      return res
        .status(400)
        .json({ message: "لا يوجد درس لاحق. لقد وصلت إلى نهاية المنهج." });
    }

    group.currentLessonIndex += 1;
    await group.save();

    const lesson = curriculum.lessons[group.currentLessonIndex] || null;
    res.json({
      message: "تم الانتقال إلى الدرس التالي.",
      group,
      lesson,
      currentLessonIndex: group.currentLessonIndex,
      totalLessons: curriculum.lessons.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const getStudentLessons = async (req, res) => {
  try {
    const studentId = req.user._id;

    const groups = await Group.find({ studentIds: studentId }).populate(
      "curriculumId",
    );

    const assignedGroup =
      groups.find((group) => group.curriculumId) || groups[0] || null;

    if (!assignedGroup || !assignedGroup.curriculumId) {
      return res.status(200).json({
        curriculum: null,
        currentLessonIndex: 0,
        progressList: [],
        message: "لا يوجد منهج مخصص لك الآن، لكنك على الطريق الصحيح! 🌟",
      });
    }

    const curriculum = assignedGroup.curriculumId;
    const progressList = await LessonProgress.find({
      studentId,
      curriculumId: curriculum._id,
    }).lean();

    res.json({
      curriculum,
      currentLessonIndex: assignedGroup.currentLessonIndex ?? 0,
      progressList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const getAdminLessonProgress = async (req, res) => {
  try {
    const groups = await Group.find({})
      .populate("studentIds", "firstName lastName")
      .populate("curriculumId", "name lessons")
      .lean();

    const rows = [];

    for (const group of groups) {
      if (!group.curriculumId || !Array.isArray(group.studentIds)) {
        continue;
      }

      const currentIndex = Math.max(0, Number(group.currentLessonIndex ?? 0));
      const currentLesson =
        group.curriculumId.lessons?.[currentIndex] ||
        group.curriculumId.lessons?.[0] ||
        null;

      for (const student of group.studentIds) {
        const progressRecords = await LessonProgress.find({
          studentId: student._id,
          curriculumId: group.curriculumId._id,
        })
          .sort({ lastWatchedAt: -1 })
          .lean();

        const matchingProgress =
          progressRecords.find((entry) => entry.lessonIndex === currentIndex) ||
          progressRecords[0] ||
          null;
        const watchPercentage = matchingProgress?.watchPercentage ?? 0;

        rows.push({
          groupId: group._id,
          groupName: group.name,
          studentId: student._id,
          studentName:
            `${student.firstName || ""} ${student.lastName || ""}`.trim(),
          currentLessonIndex: currentIndex,
          currentLessonTitle: currentLesson?.title || "لا يوجد درس مخصص",
          watchPercentage,
          hasWatched: watchPercentage >= 75,
          status:
            watchPercentage >= 75
              ? "✅ أتم المشاهدة"
              : watchPercentage > 0
                ? "👀 شاهد جزءاً"
                : "⚠️ لم يشاهد بعد",
          lastWatchedAt: matchingProgress?.lastWatchedAt || null,
        });
      }
    }

    res.json({ lessonProgress: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const trackLessonProgress = async (req, res) => {
  try {
    const { curriculumId, lessonIndex, percentage } = req.body;

    if (
      !curriculumId ||
      typeof lessonIndex !== "number" ||
      typeof percentage !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message: "يرجى إرسال معرف المنهج، رقم الدرس، ونسبة المشاهدة.",
      });
    }

    const safePercentage = Math.max(0, Math.min(100, Number(percentage) || 0));

    const existingProgress = await LessonProgress.findOne({
      studentId: req.user._id,
      curriculumId,
      lessonIndex,
    });

    const watchPercentage = existingProgress
      ? Math.max(existingProgress.watchPercentage || 0, safePercentage)
      : safePercentage;

    const progress = await LessonProgress.findOneAndUpdate(
      {
        studentId: req.user._id,
        curriculumId,
        lessonIndex,
      },
      {
        studentId: req.user._id,
        curriculumId,
        lessonIndex,
        watchPercentage,
        hasWatched: watchPercentage >= 75,
        lastWatchedAt: new Date(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.json({
      message: "تم تحديث تقدم الدرس بنجاح.",
      progress,
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
  createCurriculum,
  getCurriculums,
  getCurriculumById,
  updateCurriculum,
  deleteCurriculum,
  uploadLessonPdf,
  assignCurriculumToGroup,
  getCurrentLesson,
  advanceGroupLesson,
  getStudentLessons,
  getAdminLessonProgress,
  trackLessonProgress,
};
