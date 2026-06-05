const fetchVerses = (surahName, startVerse, endVerse) => {
  // Mock data simulating Quran.com API response
  const mockVerses = [];
  for (let i = startVerse; i <= endVerse; i++) {
    mockVerses.push({
      verseNumber: i,
      text: `${surahName} - Verse ${i}`,
      audioUrl: `https://example.com/audio/${surahName}/${i}.mp3`,
    });
  }
  return mockVerses;
};

module.exports = {
  fetchVerses,
};
