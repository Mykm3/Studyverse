const supabase = require('./supabaseClient');

/**
 * Tests Supabase Storage connectivity by listing files in the 'studyverse-uploads' bucket.
 * @returns {Promise<{success: boolean, files?: any[], error?: string}>}
 */
async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.storage.from('studyverse-uploads').list('');
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, files: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { testSupabaseConnection }; 