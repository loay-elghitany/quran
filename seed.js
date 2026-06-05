require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const User = require("./src/models/user.model");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/quran-memorization";

const initialAdminData = {
  firstName: "Super",
  lastName: "Admin",
  email: "elghitany@quran.com",
  password: "Loay@1234",
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
    const existingSuperAdmin = await User.findOne({ role: "SuperAdmin" });

    if (existingSuperAdmin) {
      console.log("SuperAdmin already exists:", existingSuperAdmin.email);
    } else {
      const adminUser = new User(initialAdminData);
      await adminUser.save();
      console.log("Created initial SuperAdmin:", adminUser.email);
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
