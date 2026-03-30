import fs from "fs";

type ParsedSelector = {
  type: string;
  role?: string;
  name?: string;
  value?: string;
};

type Step = {
  action: string;
  selector?: ParsedSelector;
  value?: string | number;
  name?: string;
};

type TestCase = {
  title: string;
  steps: Step[];
};

export class TestAgent {

  readTestCase(filePath: string): string {
    return fs.readFileSync(filePath, "utf-8");
  }

  splitTestCases(content: string): string[] {
    return content.split("##").slice(1);
  }

  loadLocators(fileName: string) {
    const path = `./locators/${fileName}.json`;
    return fs.existsSync(path)
      ? JSON.parse(fs.readFileSync(path, "utf-8"))
      : {};
  }

  loadEnv(envName: any): Record<string, any> {
    const envPath = `./environments/${envName}.json`;
    if (!fs.existsSync(envPath)) {
      console.warn(`⚠️ Environment file not found: ${envPath}, using empty config`);
      return {};
    }
    return JSON.parse(fs.readFileSync(envPath, "utf-8"));
  }

  resolveEnvVars(value: string, env: Record<string, any>): string {
    // Replace {{baseUrl}}
    let result = value.replace(/\{\{baseUrl\}\}/g, env.baseUrl ?? "");
    // Replace {{env.someKey}}
    result = result.replace(/\{\{env\.([^}]+)\}\}/g, (_, key) => env[key] ?? `{{env.${key}}}`);
    return result;
  }

  getTestCases(content: string, fileName: string, env: Record<string, any> = {}): TestCase[] {
    const locators = this.loadLocators(fileName);

    return this.splitTestCases(content).map(tc => ({
      title: (tc.split("\n")[0] || "").trim(),
      steps: this.parseStepsFromMD(tc, locators, env)
    }));
  }

  generateRandomValue(value: string): string {

    if (value.includes("{{randomEmail}}"))
      return `user${Date.now()}@test.com`;

    if (value.includes("{{randomString}}"))
      return Math.random().toString(36).substring(2, 8);

    if (value.includes("{{randomNumber}}"))
      return (Math.floor(Math.random() * 9000000000) + 1000000000).toString();

    if (value.includes("{{randomFrom:")) {
      const list = value.match(/{{randomFrom:(.*?)}}/)?.[1]
        ?.split(",").map(v => v.trim());

      return list?.[Math.floor(Math.random() * list.length)] || value;
    }

    return value;
  }

  parseSelector(selector: string): ParsedSelector {

    if (!selector) {
      console.warn("⚠️  parseSelector: locator key not found in locators JSON — check your .md step matches a key in the locators file");
      return { type: "css", value: "" };
    }

    if (selector.includes("getByRole")) {
      const m = selector.match(/getByRole\((.*?),\s*(.*?)\)/);
      if (m) return { type: "role", role: m[1]?.trim() ?? "", name: m[2]?.trim() ?? "" };
    }

    if (selector.includes("getByText"))
      return { type: "text", value: selector.match(/getByText\((.*?)\)/)?.[1] ?? "" };

    if (selector.includes("getByLabel"))
      return { type: "label", value: selector.match(/getByLabel\((.*?)\)/)?.[1] ?? "" };

    if (selector.includes("getByPlaceholder"))
      return { type: "placeholder", value: selector.match(/getByPlaceholder\((.*?)\)/)?.[1] ?? "" };

    // XPath: starts with // or (// or explicit xpath= prefix
    if (selector.startsWith("xpath=") || selector.startsWith("//") || selector.startsWith("(//"))
      return { type: "xpath", value: selector.replace(/^xpath=/, "") };

    return { type: "css", value: selector };
  }

  parseStepsFromMD(content: string, locators: any, env: Record<string, any> = {}): Step[] {

    const steps: Step[] = [];
    

    for (const line of content.split("\n").map(l => l.trim())) {
      if (!line) continue;
      if (line.includes("Go to")) {
        const name = line.match(/as "(.*?)"/i)?.[1];
        const rawUrl = line.replace(/.*Go to\s+/i, "").replace(/\s+as\s+"[^"]*"\s*$/i, "").trim();
        const url = this.resolveEnvVars(rawUrl, env);
        steps.push({
          action: "goto",
          value: url,
          name: name || "Navigate to page"
        });
      }

      if (line.includes("Enter")) {
        const raw = this.resolveEnvVars(line.match(/"(.*?)"/)?.[1] || "", env);
        const val = this.generateRandomValue(raw);
        const key = line.match(/into "(.*?)"/)?.[1];
        if (!key) continue;
        const name = line.match(/as "(.*?)"/i)?.[1];

        steps.push({
          action: "fill",
          selector: this.parseSelector(locators[key]),
          value: val,
          name: name + ": " + val || "Enter value"
        });
      }

      if (line.includes("Click")) {
        const key = line.match(/"(.*?)"/)?.[1];
        if (!key) continue;
        const name = line.match(/as "(.*?)"/i)?.[1];
        steps.push({
          action: "click",
          selector: this.parseSelector(locators[key]),
          name: name + ": " + key || "Click element"
        });
      }

      if (line.includes("Verify")) {
        const val = line.match(/"(.*?)"/)?.[1];
        const key = line.match(/into "(.*?)"/)?.[1];
        if (!key || !val) continue;
        const name = line.match(/as "(.*?)"/i)?.[1];
        steps.push({
          action: "verifyText",
          selector: this.parseSelector(locators[key]),
          value: val,
          name: name + ": " + val || "Verify text"
        });
      }

      if (line.includes("Select")) {
        const val = this.generateRandomValue(line.match(/"(.*?)"/)?.[1] || "");
        const key = line.match(/from "(.*?)"/)?.[1];
        if (!key || !val) continue;
        const name = line.match(/as "(.*?)"/i)?.[1];
        steps.push({
          action: "select",
          selector: this.parseSelector(locators[key]),
          value: val,
          name: name + ": " + val || "Select option"
        });
      }

      if (line.includes("Wait")) {
        const seconds = line.match(/(\d+)\s*second/)?.[1];
        if (!seconds) continue;
        const name = line.match(/as "(.*?)"/i)?.[1];
        steps.push({
          action: "wait",
          value: parseInt(seconds, 10) * 1000,
          name: name || "Wait"
        });
      }

      if (line.includes("PressSequentially")) {
        const raw = this.resolveEnvVars(line.match(/"(.*?)"/)?.[1] || "", env);
        const val = this.generateRandomValue(raw);
        const key = line.match(/into "(.*?)"/)?.[1];
        if (!key || !val) continue;
        const name = line.match(/as "(.*?)"/i)?.[1];
        steps.push({
          action: "fillByCharacter",
          selector: this.parseSelector(locators[key]),
          value: val,
          name: name +": " + val || "Press sequentially" 
        });
      }

    }

    return steps;
  }
}