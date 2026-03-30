import fs from "fs";
import path from "path";
import { TestAgent } from "./agent";
import { runSteps, globalReport } from "./executor";

(async () => {
  try {
    const agent = new TestAgent();
    const folderPath = "./testcases";

    // Parse --env <name> argument (default: dev)
    const envArgIndex = process.argv.indexOf("--env");
    const envName = envArgIndex !== -1 ? process.argv[envArgIndex + 1] : "dev";
    const env = agent.loadEnv(envName);

    console.log(`🌍 Environment: ${env.name ?? envName} | Base URL: ${env.baseUrl ?? "(not set)"}`);
    console.log("📂 Reading all .md files...");

    const files = fs.readdirSync(folderPath)
      .filter(file => file.endsWith("out.md"));

    if (files.length === 0) {
      console.log("❌ No .md files found");
      return;
    }

    console.log(`📄 Found ${files.length} file(s)`);

    let fileIndex = 1;

    for (const file of files) {

      const filePath = path.join(folderPath, file);
      const fileName = file.replace(".md", "");

      console.log("\n====================================");
      console.log(`📂 Running File ${fileIndex}: ${file}`);
      console.log("====================================");

      const content = agent.readTestCase(filePath);
      const testCases = agent.getTestCases(content, fileName, env);

      let testIndex = 1;

      for (const tc of testCases) {

        console.log("\n------------------------------------");
        console.log(`🚀 Test ${testIndex}: ${tc.title}`);
        console.log("------------------------------------");

        if (!tc.steps.length) {
          console.log("⚠️ No steps found, skipping...");
          continue;
        }

        await runSteps(tc.steps, `${file} - ${tc.title}`);
        testIndex++;
      }

      fileIndex++;
    }

    console.log("\n🎉 All MD files executed");

    generateFinalReport(env);

  } catch (error: any) {
    console.error("❌ Execution error:", error.message);
  }
})();

function generateFinalReport(env: Record<string, any> = {}) {

  let totalSteps = 0;
  let passed = 0;
  let failed = 0;

  let html = `
  <h1>🚀 Test Execution Report</h1>
  <p><strong>Environment:</strong> ${env.name ?? "dev"} &nbsp;|&nbsp; <strong>Base URL:</strong> ${env.baseUrl ?? "N/A"}</p>

  <style>
    body { font-family: Arial; padding: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; }
    th { background: #f4f4f4; }
    .passed { background: #d4edda; }
    .failed { background: #f8d7da; }
  </style>
  `;

  globalReport.forEach((test: any) => {
    test.steps.forEach((step: any) => {
      totalSteps++;
      if (step.status === "PASSED") passed++;
      else failed++;
    });
  });

  html += `
    <h3>Total: ${totalSteps} | Passed: ${passed} | Failed: ${failed}</h3>
  `;

  globalReport.forEach((test: any, index: number) => {

    html += `<h2>Test ${index + 1}: ${test.testName}</h2>`;

    html += `<table>
      <tr>
        <th>Step</th>
        <th>Name</th>
        <th>Action</th>
        <th>Status</th>
        <th>Error</th>
      </tr>`;

    test.steps.forEach((step: any) => {
      html += `<tr>
        <td>${step.step}</td>
        <td>${step.name || ""}</td>
        <td>${step.action}</td>
        <td class="${step.status === "PASSED" ? "passed" : "failed"}">${step.status}</td>
        <td>${step.error || ""}</td>
      </tr>`;
    });

    html += `</table>`;
  });

  fs.writeFileSync("report.html", html);
  console.log("📊 Report generated: report.html");
}