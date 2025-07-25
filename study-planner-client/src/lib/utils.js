/**
 * Combines multiple class names into a single string
 * @param {...string} classes - Class names to combine
 * @returns {string} - Combined class names
 */
export function cn(...classes) {
    return classes.filter(Boolean).join(" ")
  }
  
  
// Fixed color palette for subjects
export const SUBJECT_COLOR_PALETTE = [
  '#4361ee', // blue
  '#3a0ca3', // purple
  '#f72585', // pink
  '#7209b7', // deep purple
  '#4cc9f0', // bright blue
  '#f94144', // red
  '#06d6a0', // teal
  '#ffbe0b', // yellow
  '#8338ec', // violet
  '#3a86ff', // sky blue
  '#ff006e', // magenta
  '#fb5607', // orange
  '#43aa8b', // green
  '#b5179e', // dark magenta
  '#ffb4a2', // peach
];

// Generate a vibrant color based on a string (fallback)
export function generateColorFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 85%, 50%)`;
}

// Assign unique colors to subjects
export function getSubjectColorMap(subjects) {
  const colorMap = {};
  const uniqueSubjects = Array.from(new Set(subjects.map(s => typeof s === 'string' ? s : s.name)));
  uniqueSubjects.forEach((subject, idx) => {
    if (idx < SUBJECT_COLOR_PALETTE.length) {
      colorMap[subject] = SUBJECT_COLOR_PALETTE[idx];
    } else {
      colorMap[subject] = generateColorFromString(subject);
    }
  });
  return colorMap;
}
  
  