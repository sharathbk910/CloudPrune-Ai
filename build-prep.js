const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting CloudPrune Vercel Build Preparation...');

const rootDir = __dirname;
const publicDir = path.join(rootDir, 'public');

// 1. Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 2. Build Vite React Client if client directory exists
const clientDir = path.join(rootDir, 'client');
if (fs.existsSync(clientDir)) {
  try {
    console.log('📦 Installing and building React client in client/...');
    execSync('npm install --prefix client && npm run --prefix client build', { stdio: 'inherit' });
    console.log('✅ React client built successfully.');

    const clientDist = path.join(clientDir, 'dist');
    if (fs.existsSync(clientDist)) {
      // Copy assets to public/assets
      const distAssets = path.join(clientDist, 'assets');
      const publicAssets = path.join(publicDir, 'assets');
      if (fs.existsSync(distAssets)) {
        fs.cpSync(distAssets, publicAssets, { recursive: true });
      }

      // Setup /app and /console routes with client index.html
      const appDir = path.join(publicDir, 'app');
      const consoleDir = path.join(publicDir, 'console');
      fs.mkdirSync(appDir, { recursive: true });
      fs.mkdirSync(consoleDir, { recursive: true });
      fs.copyFileSync(path.join(clientDist, 'index.html'), path.join(appDir, 'index.html'));
      fs.copyFileSync(path.join(clientDist, 'index.html'), path.join(consoleDir, 'index.html'));
    }
  } catch (err) {
    console.warn('⚠️ Client build warning (continuing with landing page):', err.message);
  }
}

// 3. Copy root landing page assets into public/
const filesToCopy = [
  'index.html',
  'style.css',
  'app.js',
  'gemini_generated_video_a53d7be8.mp4',
  'ai.webp',
  'clors.avif',
  'clors.png',
  'search bar.png',
  'signup.jpg',
  'temp.jpg'
];

filesToCopy.forEach(file => {
  const src = path.join(rootDir, file);
  const dest = path.join(publicDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied ${file} to public/`);
  }
});

console.log('🎉 CloudPrune build preparation complete! Assets ready in public/.');
