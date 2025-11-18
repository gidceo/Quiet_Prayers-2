// Simple content moderation
const inappropriateWords = [
  'hate', 'kill', 'murder', 'die', 'death', 'violence', 'attack',
  'racist', 'sexist', 'discrimination', 'harassment', 'abuse',
  'curse', 'damn', 'hell', 'bastard', 'bitch', 'ass', 'shit', 'fuck',
  'crap', 'piss', 'asshole', 'dick', 'cock', 'pussy', 'whore', 'slut'
];

export function isProfane(text: string): boolean {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  
  return inappropriateWords.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });
}

export function moderateContent(text: string): { isProfane: boolean; message?: string } {
  if (isProfane(text)) {
    return {
      isProfane: true,
      message: "Content moderation failed. Please ensure your message is respectful and appropriate."
    };
  }
  
  return { isProfane: false };
}
