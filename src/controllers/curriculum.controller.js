const path = require("path");
const Curriculum = require("../models/curriculum.model");
const Group = require("../models/group.model");

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
    res.status(500).json({ message: "حدث خطأ أثناء إنشاء المنهج." });
  }
};

const getCurriculums = async (req, res) => {
  try {
    const curriculums = await Curriculum.find().sort({ createdAt: -1 });
    res.json({ curriculums });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب المناهج." });
  }
};

const getCurriculumById = async (req, res) => {
  try {
    const { id } = req.params;
    const curriculum = await Curriculum.findById(id);
    if (!curriculum) {
      return res.status(404).json({ message: "المنهج غير موجود." });
    }
    res.json({ curriculum });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب المنهج." });
  }
};

const updateCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, lessons, target } = req.body;

    const curriculum = await Curriculum.findById(id);
    if (!curriculum) {
      return res.status(404).json({ message: "المنهج غير موجود." });
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
    res.status(500).json({ message: "حدث خطأ أثناء تحديث المنهج." });
  }
};

const deleteCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const curriculum = await Curriculum.findByIdAndDelete(id);
    if (!curriculum) {
      return res.status(404).json({ message: "المنهج غير موجود." });
    }
    res.json({ message: "تم حذف المنهج بنجاح." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء حذف المنهج." });
  }
};

const uploadLessonPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "يرجى رفع ملف PDF." });
    }

    const pdfUrl = `/uploads/pdfs/${req.file.filename}`;
    res.status(201).json({ message: "تم رفع الملف بنجاح.", pdfUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء رفع الملف." });
  }
};

const assignCurriculumToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { curriculumId } = req.body;

    if (!curriculumId) {
      return res.status(400).json({ message: "يرجى تحديد المنهج." });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "المجموعة غير موجودة." });
    }

    const curriculum = await Curriculum.findById(curriculumId);
    if (!curriculum) {
      return res.status(404).json({ message: "المنهج غير موجود." });
    }

    group.curriculumId = curriculumId;
    group.currentLessonIndex = 0;
    await group.save();

    res.json({ message: "تم تعيين المنهج للمجموعة بنجاح.", group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء تعيين المنهج للمجموعة." });
  }
};

const getCurrentLesson = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId).populate("curriculumId");

    if (!group) {
      return res.status(404).json({ message: "المجموعة غير موجودة." });
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
    res.status(500).json({ message: "حدث خطأ أثناء جلب الدرس الحالي." });
  }
};

const advanceGroupLesson = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId).populate("curriculumId");

    if (!group) {
      return res.status(404).json({ message: "المجموعة غير موجودة." });
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
    res.status(500).json({ message: "حدث خطأ أثناء التقدم إلى الدرس التالي." });
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
};
