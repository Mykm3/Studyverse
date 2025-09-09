import api from './api';

// Utility function to create hash of extracted text (simple hash for client-side)
const createSimpleHash = (text) => {
  if (!text) return '';
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

// ==================== CONVERSATION API ====================

export const conversationApi = {
  // Get conversation history for a session
  async getConversation(sessionId, page = 1, limit = 50) {
    try {
      const response = await api.get(`/api/session-data/conversation/${sessionId}`, {
        params: { page, limit }
      });
      return response; // api.get already returns parsed JSON data
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return { messages: [], totalMessages: 0, hasMore: false };
    }
  },

  // Save entire conversation
  async saveConversation(sessionId, messages, subject, documentId) {
    try {
      const response = await api.post(`/api/session-data/conversation/${sessionId}`, {
        messages,
        subject,
        documentId
      });
      return response; // api already returns parsed JSON data
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw error;
    }
  },

  // Add single message to conversation
  async addMessage(sessionId, role, content, subject, documentId) {
    try {
      const response = await api.post(`/api/session-data/conversation/${sessionId}/message`, {
        role,
        content,
        subject,
        documentId
      });
      return response; // api already returns parsed JSON data
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }
};

// ==================== SUMMARY API ====================

export const summaryApi = {
  // Get summary for a session
  async getSummary(sessionId) {
    try {
      const response = await api.get(`/api/session-data/summary/${sessionId}`);
      return response; // api.get already returns parsed JSON data
    } catch (error) {
      console.error('Error fetching summary:', error);
      return { summary: null };
    }
  },

  // Save summary
  async saveSummary(sessionId, summary, subject, documentId, extractedText) {
    try {
      const response = await api.post(`/api/session-data/summary/${sessionId}`, {
        summary,
        subject,
        documentId,
        extractedText
      });
      return response; // api already returns parsed JSON data
    } catch (error) {
      console.error('Error saving summary:', error);
      throw error;
    }
  },

  // Check if summary should be regenerated (based on text hash)
  shouldRegenerateSummary(existingSummary, currentExtractedText) {
    if (!existingSummary) return true;
    
    const currentHash = createSimpleHash(currentExtractedText);
    const existingHash = createSimpleHash(existingSummary.extractedText);
    
    return currentHash !== existingHash;
  }
};

// ==================== QUIZ API ====================

export const quizApi = {
  // Get quiz for a session
  async getQuiz(sessionId) {
    try {
      const response = await api.get(`/api/session-data/quiz/${sessionId}`);
      return response; // api.get already returns parsed JSON data
    } catch (error) {
      console.error('Error fetching quiz:', error);
      return { quiz: null };
    }
  },

  // Save quiz
  async saveQuiz(sessionId, questions, subject, documentId, extractedText) {
    try {
      const response = await api.post(`/api/session-data/quiz/${sessionId}`, {
        questions,
        subject,
        documentId,
        extractedText
      });
      return response; // api already returns parsed JSON data
    } catch (error) {
      console.error('Error saving quiz:', error);
      throw error;
    }
  },

  // Update quiz answers and score
  async updateQuizAnswers(sessionId, userAnswers, score, completed) {
    try {
      const response = await api.put(`/api/session-data/quiz/${sessionId}/answers`, {
        userAnswers,
        score,
        completed
      });
      return response; // api already returns parsed JSON data
    } catch (error) {
      console.error('Error updating quiz answers:', error);
      throw error;
    }
  },

  // Check if quiz should be regenerated (based on text hash)
  shouldRegenerateQuiz(existingQuiz, currentExtractedText) {
    if (!existingQuiz) return true;
    
    const currentHash = createSimpleHash(currentExtractedText);
    const existingHash = createSimpleHash(existingQuiz.extractedText);
    
    return currentHash !== existingHash;
  }
};

// ==================== UTILITY FUNCTIONS ====================

export const sessionDataUtils = {
  // Get storage statistics for current user
  async getStorageStats() {
    try {
      const response = await api.get('/api/session-data/stats');
      return response; // api already returns parsed JSON data
    } catch (error) {
      console.error('Error fetching storage stats:', error);
      return null;
    }
  },

  // Manual cleanup (for admin/debug purposes)
  async runCleanup(type = 'all') {
    try {
      const response = await api.post('/api/session-data/cleanup', { type });
      return response; // api already returns parsed JSON data
    } catch (error) {
      console.error('Error running cleanup:', error);
      throw error;
    }
  },

  // Debounced save function to prevent too frequent API calls
  createDebouncedSave(saveFunction, delay = 2000) {
    let timeoutId;
    
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        saveFunction(...args);
      }, delay);
    };
  },

  // Format messages for display
  formatMessagesForDisplay(messages) {
    return messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp || new Date().toISOString()
    }));
  },

  // Validate session data before saving
  validateSessionData(sessionId, data) {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    if (data.messages && !Array.isArray(data.messages)) {
      throw new Error('Messages must be an array');
    }

    if (data.messages) {
      for (const msg of data.messages) {
        if (!msg.role || !msg.content) {
          throw new Error('Each message must have role and content');
        }
        if (!['user', 'assistant'].includes(msg.role)) {
          throw new Error('Message role must be "user" or "assistant"');
        }
      }
    }

    return true;
  }
};

// Export all APIs as default
export default {
  conversation: conversationApi,
  summary: summaryApi,
  quiz: quizApi,
  utils: sessionDataUtils
};
