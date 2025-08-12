#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔍 Verifying Vercel deployment setup...\n");

// Check for required files
const requiredFiles = [
  "vercel.json",
  "api/index.ts",
  "dist/spa/index.html",
  "package.json",
];

let allFilesExist = true;

requiredFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

// Check vercel.json configuration
try {
  const vercelConfig = JSON.parse(fs.readFileSync("vercel.json", "utf8"));

  console.log("\n📋 Vercel configuration:");
  console.log(`   Framework: ${vercelConfig.framework}`);
  console.log(`   Build command: ${vercelConfig.buildCommand}`);
  console.log(`   Output directory: ${vercelConfig.outputDirectory}`);

  if (vercelConfig.functions && vercelConfig.functions["api/index.ts"]) {
    console.log("✅ Serverless function configured");
  } else {
    console.log("❌ Serverless function not configured");
    allFilesExist = false;
  }
} catch (error) {
  console.log("❌ Error reading vercel.json:", error.message);
  allFilesExist = false;
}

// Check package.json
try {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

  const requiredDeps = ["serverless-http", "@supabase/supabase-js", "express"];
  console.log("\n📦 Dependencies:");

  requiredDeps.forEach((dep) => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep} installed`);
    } else {
      console.log(`❌ ${dep} missing`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log("❌ Error reading package.json:", error.message);
  allFilesExist = false;
}

// Check environment variables
console.log("\n🔧 Environment setup:");
if (fs.existsSync(".env.vercel")) {
  console.log("✅ .env.vercel file exists (reference for Vercel dashboard)");
} else {
  console.log("⚠️  .env.vercel file missing (not critical)");
}

if (fs.existsSync("VERCEL_DEPLOYMENT.md")) {
  console.log("✅ Deployment documentation exists");
} else {
  console.log("⚠️  VERCEL_DEPLOYMENT.md missing");
}

console.log("\n" + "=".repeat(50));

if (allFilesExist) {
  console.log("🎉 Project is ready for Vercel deployment!");
  console.log("\nNext steps:");
  console.log("1. Push your code to GitHub");
  console.log("2. Connect your repository to Vercel");
  console.log("3. Set environment variables in Vercel dashboard");
  console.log("4. Deploy!");
} else {
  console.log("❌ Some issues need to be resolved before deployment");
}

console.log("\n📖 For detailed instructions, see VERCEL_DEPLOYMENT.md");
