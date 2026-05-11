export const isArabicText = (text?: string | null): boolean => {
  if (!text || typeof text !== 'string') return true; // Default to Arabic in this app
  
  // Find the first alphabetical character (Latin or Arabic)
  const firstCharMatch = text.match(/[a-zA-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/);
  
  if (firstCharMatch) {
    const char = firstCharMatch[0];
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicRegex.test(char);
  }
  
  return true; // Default to Arabic if only numbers/symbols
};
