const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/pages/Landing.jsx',
  'frontend/src/pages/Dashboard.jsx',
  'frontend/src/pages/Login.jsx',
  'frontend/src/pages/StockDetail.jsx',
  'frontend/src/pages/Markets.jsx',
  'frontend/src/pages/Watchlist.jsx',
  'frontend/src/pages/Portfolio.jsx',
  'frontend/src/pages/NewsSentiment.jsx',
  'frontend/src/components/ChatBot.jsx',
  'frontend/src/components/Sidebar.jsx',
];

const baseDir = __dirname;

files.forEach(file => {
  const filePath = path.join(baseDir, file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace import statement
    content = content.replace(
      /import\s*{([^}]*?)TrendingUp(.*?)}\s*from\s*['"](lucide-react|\.\.\/)['"]/,
      (match, before, after, module) => {
        // Check if Brain is already imported
        if (match.includes('Brain')) {
          return match.replace(/,?\s*TrendingUp\s*,?/g, '');
        }
        return `import {${before}Brain${after}} from '${module}'`;
      }
    );
    
    // Replace <TrendingUp with <Brain
    content = content.replace(/<TrendingUp/g, '<Brain');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated ${file}`);
  } else {
    console.log(`✗ File not found: ${file}`);
  }
});

console.log('\n✓ Logo replacement complete!');
