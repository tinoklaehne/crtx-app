#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Starting static site regeneration...');

try {
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    console.error('❌ Error: package.json not found. Please run this script from the project root.');
    process.exit(1);
  }

  // Clean the output directory
  console.log('🧹 Cleaning previous build...');
  if (fs.existsSync('out')) {
    fs.rmSync('out', { recursive: true, force: true });
  }

  // Build the static site
  console.log('🏗️  Building static site...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('✅ Static site regeneration completed successfully!');
  console.log('');
  console.log('📁 Static files are now available in the "out" directory');
  console.log('🚀 You can deploy these files to any static hosting service');
  
} catch (error) {
  console.error('❌ Error during regeneration:', error.message);
  process.exit(1);
} 