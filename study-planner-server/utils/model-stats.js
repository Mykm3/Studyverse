// Model usage statistics tracker
const modelStats = {
  gemini_2_5_flash: {
    count: 0,
    totalTokens: 0,
    totalTime: 0,
    tasks: {}
  },
  gemini_2_5_pro: {
    count: 0,
    totalTokens: 0,
    totalTime: 0,
    tasks: {}
  }
};

function recordModelUsage(modelName, task, tokens, timeMs) {
  const modelKey = modelName.replace(/\./g, '_');
  
  if (!modelStats[modelKey]) {
    modelStats[modelKey] = {
      count: 0,
      totalTokens: 0,
      totalTime: 0,
      tasks: {}
    };
  }
  
  modelStats[modelKey].count++;
  modelStats[modelKey].totalTokens += tokens || 0;
  modelStats[modelKey].totalTime += timeMs || 0;
  
  if (!modelStats[modelKey].tasks[task]) {
    modelStats[modelKey].tasks[task] = 0;
  }
  modelStats[modelKey].tasks[task]++;
  
  console.log(`📊 Model Usage: ${modelName} for ${task} (${tokens || 'unknown'} tokens, ${timeMs || 'unknown'}ms)`);
}

function getModelStats() {
  return {
    ...modelStats,
    summary: {
      totalRequests: Object.values(modelStats).reduce((sum, model) => sum + model.count, 0),
      totalTokens: Object.values(modelStats).reduce((sum, model) => sum + model.totalTokens, 0),
      averageTime: Object.values(modelStats).reduce((sum, model) => sum + model.totalTime, 0) / 
                   Object.values(modelStats).reduce((sum, model) => sum + model.count, 0) || 0
    }
  };
}

function logModelStats() {
  const stats = getModelStats();
  console.log('\n📈 Model Usage Statistics:');
  console.log('========================');
  
  Object.entries(stats).forEach(([model, data]) => {
    if (model === 'summary') return;
    
    console.log(`\n🤖 ${model.replace(/_/g, '.')}:`);
    console.log(`   Requests: ${data.count}`);
    console.log(`   Total Tokens: ${data.totalTokens}`);
    console.log(`   Average Time: ${data.totalTime / data.count || 0}ms`);
    console.log(`   Tasks:`, data.tasks);
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total Requests: ${stats.summary.totalRequests}`);
  console.log(`   Total Tokens: ${stats.summary.totalTokens}`);
  console.log(`   Average Time: ${stats.summary.averageTime.toFixed(2)}ms`);
}

module.exports = {
  recordModelUsage,
  getModelStats,
  logModelStats
}; 