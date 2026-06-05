import React from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-quran-50 to-white">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-6">
        <div className="text-2xl font-bold text-quran-700 font-kufi">
          كتّاب رتل وارتق
        </div>
        <Link
          to="/login"
          className="px-6 py-2 bg-quran-600 text-white rounded-lg hover:bg-quran-700 transition-colors"
        >
          تسجيل الدخول
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-6 py-24 md:py-32 text-center">
        <div className="max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold text-quran-900 mb-6 font-kufi">
            تحفيظ كتاب الله بأسلوب حديث وممتع
          </h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            انضم إلى كتّاب رتل وارتق لتجربة تحفيظ القرآن الكريم بطريقة مبتكرة
            تجمع بين التقاليد والحداثة، مع دعم من معلمين ذوي خبرة وأدوات تفاعلية
            لتعزيز حفظك وتجويدك.
          </p>

          {/* Quranic Verse */}
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 mb-12 border-l-4 border-quran-600">
            <p className="text-2xl md:text-3xl text-quran-700 mb-4 font-kufi">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <p className="text-gray-600 text-lg">
              ""خَيرُكُم مَن تَعَلَّمَ القُرآنَ وعَلَّمَه""
            </p>
            <p className="text-sm text-gray-500 mt-4">Quran 1:1</p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="text-4xl mb-3">📚</div>
              <h3 className="text-xl font-bold text-quran-700 mb-2">
                استغل أجازة الصيف في حفظ القرآن
              </h3>
              <p className="text-gray-600">
                مع مجموعة من الأدوات والموارد المخصصة لمساعدة الطلاب على حفظ
                القرآن الكريم بطريقة فعالة ومحفزة.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="text-xl font-bold text-quran-700 mb-2">
                متابعة مستمرة{" "}
              </h3>
              <p className="text-gray-600">
                تقييمات دورية من المعلمين تصل إلى ولي الأمر ليتابع مستوى تقدم
                ابنه في الحفظ والتجويد، مع نصائح مخصصة لتحسين الأداء.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="text-xl font-bold text-quran-700 mb-2">
                جوائز ومسابقات تحفيزية
              </h3>
              <p className="text-gray-600">
                لتشجيع الطلاب على تحقيق إنجازاتهم في حفظ القرآن الكريم، مع جوائز
                قيمة ومسابقات دورية تعزز روح المنافسة الإيجابية
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="px-8 py-4 bg-quran-600 text-white rounded-lg font-bold hover:bg-quran-700 transition-colors text-lg"
            >
              أبدأ الآن
            </Link>
            <button className="px-8 py-4 border-2 border-quran-600 text-quran-600 rounded-lg font-bold hover:bg-quran-50 transition-colors text-lg">
              تعرف أكثر
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-quran-900 text-white py-12 text-center">
        <p>&copy; 2026 Quran Memorization Academy. All rights reserved.</p>
      </footer>
    </main>
  );
}
