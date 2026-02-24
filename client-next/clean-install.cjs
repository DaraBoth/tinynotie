#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up TinyNotie Next.js...\n');

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('🧹 Cleaning old installation...');
  fs.rmSync(nodeModulesPath, { recursive: true, force: true });
}

// Check if package-lock.json exists
const lockFilePath = path.join(__dirname, 'package-lock.json');
if (fs.existsSync(lockFilePath)) {
  fs.unlinkSync(lockFilePath);
}

console.log('📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('\n✅ Installation complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Copy .env.example to .env');
  console.log('2. Update .env with your API URL');
  console.log('3. Run "npm run dev" to start development server');
  console.log('\n🎉 Happy coding!\n');
} catch (error) {
  console.error('❌ Installation failed:', error.message);
  process.exit(1);
}
