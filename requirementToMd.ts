import * as dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import OpenAI from "openai";

let client: OpenAI;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

const SYSTEM_PROMPT = `
You are an expert QA automation engineer. Your job is to convert software requirement documents into structured Playwright test case markdown files.

The output must follow this EXACT format:

# Test Case: <Feature Name>

## Test Case 1: <Test Case Description>

1. Go to <full URL> as "<Step Description>"
2. Enter "<value>" into "<locatorKey>" as "<Step Description>"
3. Click "<locatorKey>" as "<Step Description>"
4. Verify "<expectedText>" into "<locatorKey>" as "<Step Description>"
5. Select "<option>" from "<locatorKey>" as "<Step Description>"
6. Wait for <N> seconds as "<Step Description>"
7. PressSequentially "<value>" into "<locatorKey>" as "<Step Description>"

---

## Test Case 2: <Test Case Description>
...

RULES:
- Each test case starts with ## and is separated by ---
- Supported step keywords: Go to, Enter, Click, Verify, Select, Wait, PressSequentially
- locatorKey must be a camelCase identifier (e.g., emailField, loginButton, passwordField)
- Use these dynamic placeholders where appropriate:
    {{randomEmail}}     — generates a random email
    {{randomString}}    — generates a random alphabetic string
    {{randomNumber}}    — generates a random 10-digit number
    {{randomFrom:val1,val2,val3}}  — picks randomly from the list
- Every step must end with  as "<descriptive name>"
- Go to steps must include the full URL
- Do NOT include any explanation or extra text — output ONLY the markdown content
- Cover both positive (happy path) and negative (error/edge case) test scenarios
`.trim();

async function generateMdFromRequirement(requirementText: string, featureName: string): Promise<string> {
  console.log(`\n🤖 Sending requirement to OpenAI for: "${featureName}"...`);

  const response = await getClient().chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Convert the following requirement into a test case markdown file:\n\n${requirementText}`
      }
    ],
    temperature: 0.3
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}

async function processRequirementFile(requirementFilePath: any) {
  const fullPath = path.resolve(requirementFilePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${fullPath}`);
    process.exit(1);
  }

  const requirementText = fs.readFileSync(fullPath, "utf-8");
  const featureName = path.basename(fullPath, path.extname(fullPath));
  const outputPath = path.join("./testcases", `${featureName}.md`);

  const mdContent = await generateMdFromRequirement(requirementText, featureName);

  if (!mdContent) {
    console.error("❌ OpenAI returned empty content.");
    process.exit(1);
  }

  fs.writeFileSync(outputPath, mdContent, "utf-8");
  console.log(`✅ Test case file written: ${outputPath}`);
}

async function processRequirementsFolder(folderPath: string) {
  const fullFolder = path.resolve(folderPath);

  if (!fs.existsSync(fullFolder)) {
    console.error(`❌ Folder not found: ${fullFolder}`);
    process.exit(1);
  }

  const files = fs.readdirSync(fullFolder).filter(f =>
    [".txt", ".md", ".doc"].some(ext => f.endsWith(ext))
  );

  if (files.length === 0) {
    console.log("⚠️ No requirement files found in folder.");
    return;
  }

  console.log(`📂 Found ${files.length} requirement file(s) in "${folderPath}"`);

  for (const file of files) {
    await processRequirementFile(path.join(fullFolder, file));
  }

  console.log("\n🎉 All requirement files converted to test case markdown.");
}

// ── Entry point ──────────────────────────────────────────────────────────────
// Usage:
//   npx ts-node requirementToMd.ts <requirementFile>       — single file
//   npx ts-node requirementToMd.ts --folder <folderPath>   — entire folder

(async () => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY environment variable is not set.");
      process.exit(1);
    }

    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.log("Usage:");
      console.log("  npx ts-node requirementToMd.ts <requirementFile.txt>");
      console.log("  npx ts-node requirementToMd.ts --folder <requirementsFolder>");
      process.exit(0);
    }

    if (args[0] === "--folder") {
      const folder = args[1];
      if (!folder) {
        console.error("❌ Please provide a folder path after --folder");
        process.exit(1);
      }
      await processRequirementsFolder(folder);
    } else {
      await processRequirementFile(args[0]);
    }

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
