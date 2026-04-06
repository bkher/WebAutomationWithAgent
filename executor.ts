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
      return selector.name
        ? page.getByRole(selector.role, { name: selector.name }).first()
        : page.getByRole(selector.role).first();

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

// � Tries each selector in the fallback chain. Returns the first one that finds an element.
// If a fallback (index > 0) is used, logs the healing event and promotes it to primary in the JSON.
async function resolveLocatorWithHealing(
  page: any,
  selectors: any[],
  locatorKey?: any,
  locatorsFile?: string
): Promise<any> {
  if (!selectors || selectors.length === 0)
    throw new Error(`No selectors provided for "${locatorKey}"`);

  let lastError: Error = new Error(`No working locator found for "${locatorKey}"`);

  for (let i = 0; i < selectors.length; i++) {
    // Primary gets more time; fallbacks use a shorter probe timeout
    const timeout = i === 0 ? 5000 : 2000;
    try {
      const locator = resolveLocator(page, selectors[i]);
      await locator.waitFor({ state: "attached", timeout });
      const raw = selectors[i].raw || selectors[i].value || selectors[i].type;
      if (i === 0) {
        console.log(`   🎯 Locator [${locatorKey ?? "?"}]: using primary → "${raw}"`);
      } else {
        console.log(`🔧 Self-Healed [${locatorKey}]: primary failed — using fallback[${i}] → "${raw}"`);
        if (locatorsFile) promoteHealedLocator(locatorsFile, locatorKey, i);
      }
      return locator;
    } catch (e: any) {
      lastError = e;
    }
  }

  throw lastError;
}

// 💾 Moves the healed selector to index 0 in the JSON array so the next run uses it as primary.
function promoteHealedLocator(locatorsFile: string, locatorKey: string, healedIndex: number) {
  try {
    const filePath = `./locators/${locatorsFile}.json`;
    const locators: Record<string, any> = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const entry = locators[locatorKey];
    if (Array.isArray(entry) && healedIndex > 0) {
      const [healed] = entry.splice(healedIndex, 1);
      entry.unshift(healed);
      locators[locatorKey] = entry;
      fs.writeFileSync(filePath, JSON.stringify(locators, null, 2));
      console.log(`💾 Locator promoted: "${locatorKey}" → fallback[${healedIndex}] is now primary`);
    }
  } catch (e: any) {
    console.warn(`⚠️ Could not update locator file for healing: ${e.message}`);
  }
}

// �🚀 Launches a browser, executes each step sequentially, and appends results to the global report
export async function runSteps(steps: any[], testName: string = "Test") {
  // Launch Firefox in headed mode so the browser is visible during execution
  const browser = await firefox.launch({ headless: true });
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
        case "fill": {
          if (!step.selector) throw new Error("Missing selector");
          const fillEl = await resolveLocatorWithHealing(page, step.selector, step.locatorKey, step.locatorsFile);
          await fillEl.fill(""); // Clear existing value
          await fillEl.fill(step.value);
          break;
        }
         
        case "fillByCharacter": {
          if (!step.selector) throw new Error("Missing selector");
          const seqEl = await resolveLocatorWithHealing(page, step.selector, step.locatorKey, step.locatorsFile);
          await seqEl.fill(""); // Clear existing value
          await seqEl.pressSequentially(step.value, { delay: 500 });
          break;
        }

        // 🖱️ Click the resolved element
        case "click": {
          if (!step.selector) throw new Error("Missing selector");
          const clickEl = await resolveLocatorWithHealing(page, step.selector, step.locatorKey, step.locatorsFile);
          await clickEl.click();
          break;
        }

        // 📋 Select a dropdown option by its visible label
        case "select": {
          if (!step.selector) throw new Error("Missing selector");
          const selectEl = await resolveLocatorWithHealing(page, step.selector, step.locatorKey, step.locatorsFile);
          await selectEl.selectOption({ label: step.value });
          break;
        }
          
        // ✅ Wait for the element to appear, then assert its text content contains the expected value
        case "verifyText": {
          if (!step.selector) throw new Error("Missing selector");
          const verifyEl = await resolveLocatorWithHealing(page, step.selector, step.locatorKey, step.locatorsFile);
          await verifyEl.waitFor();

          if (step.value) {
            const text = await verifyEl.textContent();

            if (!text?.includes(step.value)) {
              throw new Error(`Expected: ${step.value}, Found: ${text}`);
            }
          }
          break;
        }

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
