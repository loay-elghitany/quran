const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let ContentQuiz;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  ContentQuiz = require("../src/models/contentquiz.model");
});

afterEach(async () => {
  const collections = Object.keys(mongoose.connection.collections);
  for (const collectionName of collections) {
    await mongoose.connection.collections[collectionName].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("ContentQuiz model", () => {
  it("creates a valid content quiz with questions", async () => {
    const quiz = new ContentQuiz({
      videoTitle: "Introduction to Tajweed",
      youtubeUrl: "https://www.youtube.com/watch?v=example",
      questions: [
        {
          questionText: "What is Tajweed?",
          options: ["Recitation rules", "Prayer times", "Quranic verses"],
          correctAnswer: "Recitation rules",
        },
        {
          questionText: "Which letter is a heavy letter?",
          options: ["Alif", "Ra", "Ba"],
          correctAnswer: "Ra",
        },
      ],
    });

    const saved = await quiz.save();
    expect(saved._id).toBeDefined();
    expect(saved.videoTitle).toBe("Introduction to Tajweed");
    expect(saved.questions).toHaveLength(2);
    expect(saved.questions[0].correctAnswer).toBe("Recitation rules");
  });

  it("rejects quiz without required fields", async () => {
    const quiz = new ContentQuiz({
      questions: [],
    });

    await expect(quiz.save()).rejects.toThrow(
      /Video title is required|YouTube URL is required/,
    );
  });

  it("rejects quiz with invalid YouTube URL format", async () => {
    const quiz = new ContentQuiz({
      videoTitle: "Test",
      youtubeUrl: "invalid-url",
      questions: [],
    });

    await expect(quiz.save()).rejects.toThrow(
      /Please provide a valid YouTube URL/,
    );
  });
});
