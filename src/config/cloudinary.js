const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryPdfStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "quran_academy/pdfs",
    resource_type: "raw",
    allowedFormats: ["pdf"],
    public_id: (req, file) => `lesson-${Date.now()}`,
  },
});

const cloudinaryAudioStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "quran_academy/audio",
    resource_type: "auto",
    allowedFormats: ["wav", "mp3", "m4a", "aac", "ogg"],
    format: async (req, file) => {
      const mime = file.mimetype.toLowerCase();
      if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
      if (mime.includes("m4a")) return "m4a";
      if (mime.includes("aac")) return "aac";
      if (mime.includes("ogg")) return "ogg";
      return "wav";
    },
    public_id: (req, file) => `audio-${Date.now()}`,
  },
});

module.exports = {
  cloudinary,
  cloudinaryPdfStorage,
  cloudinaryAudioStorage,
};
