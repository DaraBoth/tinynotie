const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Delete node_modules
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('Removing node_modules...');
  try {
    if (process.platform === 'win32') {
      execSync('rmdir /s /q node_modules', { stdio: 'inherit' });
    } else {
      execSync('rm -rf node_modules', { stdio: 'inherit' });
    }
  } catch (error) {
    console.error('Error removing node_modules:', error);
  }
}

// Delete package-lock.json
const packageLockPath = path.join(__dirname, 'package-lock.json');
if (fs.existsSync(packageLockPath)) {
  console.log('Removing package-lock.json...');
  fs.unlinkSync(packageLockPath);
}

// Delete yarn.lock
const yarnLockPath = path.join(__dirname, 'yarn.lock');
if (fs.existsSync(yarnLockPath)) {
  console.log('Removing yarn.lock...');
  fs.unlinkSync(yarnLockPath);
}

// Install dependencies
console.log('Installing dependencies...');
try {
  execSync('npm install --no-package-lock', { stdio: 'inherit' });
} catch (error) {
  console.error('Error installing dependencies:', error);
}

console.log('Clean install completed!');
