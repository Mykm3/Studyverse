/**
 * Formats a date into a relative time string (e.g., "2 hours ago", "yesterday", etc.)
 * @param {Date|string} date - The date to format
 * @returns {string} A human-readable relative time string
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const inputDate = new Date(date);
  const diffInSeconds = Math.floor((now - inputDate) / 1000);

  // Less than a minute
  if (diffInSeconds < 60) {
    return 'just now';
  }

  // Less than an hour
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  // Less than a day
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }

  // Less than a week
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    if (diffInDays === 1) {
      return 'yesterday';
    }
    return `${diffInDays} days ago`;
  }

  // Less than a month
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
  }

  // Less than a year
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  }

  // More than a year
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
}

/**
 * Formats a date into a localized string
 * @param {Date|string} date - The date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} A formatted date string
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };

  return new Date(date).toLocaleDateString(undefined, {
    ...defaultOptions,
    ...options
  });
}

/**
 * Checks if a date is today
 * @param {Date|string} date - The date to check
 * @returns {boolean} True if the date is today
 */
export function isToday(date) {
  const today = new Date();
  const inputDate = new Date(date);
  
  return inputDate.getDate() === today.getDate() &&
    inputDate.getMonth() === today.getMonth() &&
    inputDate.getFullYear() === today.getFullYear();
}

/**
 * Checks if a date is yesterday
 * @param {Date|string} date - The date to check
 * @returns {boolean} True if the date is yesterday
 */
export function isYesterday(date) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const inputDate = new Date(date);
  
  return inputDate.getDate() === yesterday.getDate() &&
    inputDate.getMonth() === yesterday.getMonth() &&
    inputDate.getFullYear() === yesterday.getFullYear();
} 