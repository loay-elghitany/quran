require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const User = require("./src/models/user.model");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/quran-memorization";

// 👈 اكتب هنا بيانات الأدمن الثاني اللي أنت عايز تضيفه
const initialAdminData = {
  firstName: "Second",
  lastName: "Admin",
  email: "omoby@quran.com", // ⚠️ تأكد إن الإيميل ده مختلف عن القديم
  password: "opi@1234",
  role: "SuperAdmin",
};

async function seedSuperAdmin() {
  if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI. Please add it to .env.");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    // 🕵️‍♂️ التعديل هنا: بنبحث بالإيميل الجديد مش بالرتبة عشان نمنع التضارب
    const existingAdminByEmail = await User.findOne({ email: initialAdminData.email });

    if (existingAdminByEmail) {
      console.log(`❌ هيلو يا هندسة! الأدمن ده موجود بالفعل بنفس الإيميل: ${existingAdminByEmail.email}`);
    } else {
      const adminUser = new User(initialAdminData);
      await adminUser.save();
      console.log(`✅ عظمة! تم إنشاء الأدمن الثاني بنجاح: ${adminUser.email}`);
    }
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(process.exitCode || 0);
  }
}

seedSuperAdmin();