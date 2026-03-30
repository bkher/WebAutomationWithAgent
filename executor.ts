import { chromium, firefox } from "@playwright/test";
import fs from "fs";

// 🗂️ Global report array — accumulates results from all test runs for final report generation
let globalReport: any[] = [];
export { globalReport };

type Report = {
  step: number;
  action: string;
  status: "PASSED" | "FAILED";
  error?: string;
  name?: string;
};

// 🔍 Resolves a ParsedSelector object into a Playwright locator on the given page
function resolveLocator(page: any, selector: any) {

  if (!selector) throw new Error("Selector missing");

  switch (selector.type) {

    // Locate by ARIA role with an accessible name
    case "role":
      return page.getByRole(selector.role, { name: selector.name }).first();

    // Locate by visible text content
    case "text":
      return page.getByText(selector.value).first();

    // Locate by associated label text
    case "label":
      return page.getByLabel(selector.value).first();

    // Locate by input placeholder text
    case "placeholder":
      return page.getByPlaceholder(selector.value).first();

    // Locate by data-testid attribute
    case "testid":
      return page.getByTestId(selector.value).first();

    // Locate by XPath expression
    case "xpath":
      return page.locator(`xpath=${selector.value}`);

    // Fallback: locate by CSS selector
    case "css":
    default:
      return page.locator(selector.value);
  }
}

// 🚀 Launches a browser, executes each step sequentially, and appends results to the global report
export async function runSteps(steps: any[], testName: string = "Test") {
  // Launch Firefox in headed mode so the browser is visible during execution
  const browser = await firefox.launch({ headless: false });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  const report: Report[] = [];
  let stepIndex = 1;

  console.log(`\n🚀 Executing: ${testName}`);

  for (const step of steps) {
    const stepName = step.name || step.action;

    try {
      switch (step.action) {
        // 🌐 Navigate to the specified URL and wait until network is idle
        case "goto":
          await page.goto(step.value);
          await page.waitForLoadState("networkidle");
          await page.waitForLoadState("load"); 
          break;

        // ✏️ Type a value into the resolved input field
        case "fill":
          if (!step.selector) throw new Error("Missing selector");
          await resolveLocator(page, step.selector).fill(""); // Clear existing value
          await resolveLocator(page, step.selector).fill(step.value);
          break;
         
        case "fillByCharacter":
          if (!step.selector) throw new Error("Missing selector");
          await resolveLocator(page, step.selector).fill(""); // Clear existing value
          await resolveLocator(page, step.selector).pressSequentially(step.value, { delay: 500 });
          break;

        // 🖱️ Click the resolved element
        case "click":
          if (!step.selector) throw new Error("Missing selector");
          await resolveLocator(page, step.selector).click();
          break;

        // 📋 Select a dropdown option by its visible label
        case "select":
          if (!step.selector) throw new Error("Missing selector");
          await resolveLocator(page, step.selector).selectOption({ label: step.value });
          break;
          
        // ✅ Wait for the element to appear, then assert its text content contains the expected value
        case "verifyText":
          if (!step.selector) throw new Error("Missing selector");
          await resolveLocator(page, step.selector).waitFor();

          if (step.value) {
            const text = await resolveLocator(page, step.selector).textContent();

            if (!text?.includes(step.value)) {
              throw new Error(`Expected: ${step.value}, Found: ${text}`);
            }
          }
          break;

        // ⏳ Pause execution for the specified duration (in milliseconds)
        case "wait":
          await page.waitForTimeout(step.value);
          break;
      }

      report.push({
        step: stepIndex,
        action: step.action,
        name: stepName,
        status: "PASSED",
      });

      console.log(`✅ Step ${stepIndex}: ${stepName}`);
    } catch (error: any) {
      // 📸 Capture a screenshot on failure for debugging
      const screenshotPath = `Screenshots/error-${testName}-step-${stepIndex}.png`;
      await page.screenshot({ path: screenshotPath });

      report.push({
        step: stepIndex,
        action: step.action,
        name: stepName,
        status: "FAILED",
        error: error.message,
      });

      console.log(`❌ Step ${stepIndex}: ${stepName} - ${error.message}`);
    }

    stepIndex++;
  }

  await browser.close();

  // ✅ push into global report
  globalReport.push({
    testName,
    steps: report,
  });

  // ❌ REMOVE html/json write from here
}
