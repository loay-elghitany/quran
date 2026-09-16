const mongoose = require("mongoose");
require("dotenv").config();

async function run() {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      throw new Error("لم يتم العثور على رابط الاتصال في ملف .env");
    }

    await mongoose.connect(uri);
    console.log("متصل بقاعدة البيانات بنجاح...");

    // الوصول المباشر لكولكشن users بدون الحاجة لمسار ملف الموديل
    const result = await mongoose.connection
      .collection("users")
      .updateMany({}, { $set: { points: 0 } });

    console.log(`تم بنجاح تصفير نقاط ${result.modifiedCount} مستخدم!`);
    process.exit(0);
  } catch (err) {
    console.error("خطأ أثناء التنفيذ:", err);
    process.exit(1);
  }
}

run();
