# PlaywrightAutomationAgent

An AI-powered, codeless Playwright test automation framework. Write plain-English requirements, generate structured test case markdown with GPT-4o, and execute them against multiple environments — all without writing a single line of test code.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
  - [Step 1 — Write Requirements](#step-1--write-requirements)
  - [Step 2 — Generate Test Cases (AI)](#step-2--generate-test-cases-ai)
  - [Step 3 — Define Locators](#step-3--define-locators)
  - [Step 4 — Configure Environments](#step-4--configure-environments)
  - [Step 5 — Run Tests](#step-5--run-tests)
  - [Step 6 — View Reports](#step-6--view-reports)
- [Test Case Markdown DSL](#test-case-markdown-dsl)
  - [Supported Actions](#supported-actions)
  - [Dynamic Placeholders](#dynamic-placeholders)
  - [Selector Types](#selector-types)
- [Environments](#environments)
- [Locators](#locators)
- [Project Components](#project-components)
- [NPM Scripts](#npm-scripts)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Test Suites](#test-suites)

---

## Overview

PlaywrightAutomationAgent bridges the gap between business requirements and automated browser tests by leveraging:

- **OpenAI GPT-4o** to convert plain-text requirement documents into structured Playwright test case markdown files.
- A custom **Markdown DSL parser** (`agent.ts`) that translates the markdown into executable step objects.
- **Playwright** (Firefox, headed) to run those steps against the real browser.
- A built-in **HTML report** generator to summarize pass/fail results per step.

---

## Architecture

```
requirements/*.txt
        │
        ▼  (npm run generate — OpenAI GPT-4o)
testcases/*.md   ◄──────── locators/*.json
        │
        ▼  (npm start -- --env <name>)
    agent.ts  ──► Parses MD into Steps[]
        │
        ▼
   executor.ts ──► Playwright (Firefox headed)
        │
        ▼
  report.html / report.json  +  Screenshots/
```

---

## Project Structure

```
PlaywrightAutomationAgent/
├── main.ts                    # Orchestrator — reads MD files, runs tests, generates report
├── agent.ts                   # Markdown parser — converts test case MD into Step objects
├── executor.ts                # Playwright runner — executes steps, captures screenshots
├── requirementToMd.ts         # AI converter — requirements .txt → test case .md via GPT-4o
├── tsconfig.json              # TypeScript compiler configuration
├── package.json               # NPM scripts and dependencies
│
├── requirements/              # Plain-text requirement documents (input to AI generator)
│   ├── login.txt
│   └── registration.txt
│
├── testcases/                 # Generated/authored test case markdown files
│   ├── login.md
│   ├── registration.md
│   └── AddToCartAndCheckout.md
│
├── locators/                  # JSON files mapping locator keys to Playwright selectors
│   ├── login.json
│   ├── registration.json
│   └── AddToCartAndCheckout.json
│
├── environments/              # Environment configuration files
│   ├── dev.json
│   ├── staging.json
│   └── prod.json
│
├── Screenshots/               # Failure screenshots captured automatically
├── report.html                # HTML test execution report
└── report.json                # JSON test execution report
```

---

## How It Works

### Step 1 — Write Requirements

Create a plain-text requirement document in the `requirements/` folder describing the feature under test. Include the application URL, field locator keys, and expected behaviours.

**Example — `requirements/login.txt`:**
```
Feature: Login Functionality
Application URL: https://example.com/login

Requirements:
1. The login page must allow users to enter an email and password.
2. Clicking Login with invalid credentials should display "Incorrect email or password."
3. Clicking Login with valid credentials should show "Login Successfully" and redirect.
4. The email field locator key: emailField
5. The password field locator key: passwordField
6. The login button locator key: loginButton
7. Error/success messages locator key: errorMessage
```

---

### Step 2 — Generate Test Cases (AI)

Run the generator to send the requirement file to GPT-4o and produce a structured markdown file in `testcases/`.

```bash
# Set your OpenAI API key
export OPENAI_API_KEY=sk-...

# Generate from a single file
npx ts-node requirementToMd.ts requirements/login.txt

# Generate from the entire requirements folder
npx ts-node requirementToMd.ts --folder requirements/

# Or use the npm shortcut
npm run generate
```

The AI produces a structured `.md` file following the [Test Case Markdown DSL](#test-case-markdown-dsl) format. Both happy-path and negative/edge-case scenarios are generated automatically.

---

### Step 3 — Define Locators

Create a JSON file in `locators/` with the same base name as the test case markdown file. Each key maps to a Playwright selector expression.

**Example — `locators/login.json`:**
```json
{
  "emailField":    "getByPlaceholder(Email)",
  "passwordField": "#userPassword",
  "loginButton":   "getByRole(button, Login)",
  "errorMessage":  "#toast-container"
}
```

Supported selector formats:

| Format | Example |
|---|---|
| CSS selector | `#userEmail`, `.btn-login` |
| XPath | `//a[contains(text(),'Register')]` |
| `getByRole` | `getByRole(button, Login)` |
| `getByText` | `getByText(Submit)` |
| `getByLabel` | `getByLabel(Email Address)` |
| `getByPlaceholder` | `getByPlaceholder(Enter email)` |

---

### Step 4 — Configure Environments

Environment files in `environments/` hold the `baseUrl` and any credential or data variables interpolated at runtime via `{{env.key}}` placeholders.

**Example — `environments/dev.json`:**
```json
{
  "name": "dev",
  "baseUrl": "https://rahulshettyacademy.com",
  "validEmail": "testuser12@email.com",
  "validPassword": "Pass1234$",
  "invalidEmail": "testuser@email.com",
  "invalidPassword": "password"
}
```

---

### Step 5 — Run Tests

```bash
# Run against dev environment (default)
npm start

# Explicitly target an environment
npm run start:dev
npm run start:staging
npm run start:prod
```

> **Note:** The runner only picks up files whose names end in `out.md` (e.g., `loginout.md`). Rename or copy generated files accordingly, or update the filter in `main.ts`.

The executor:
1. Reads every matching `.md` file from `testcases/`.
2. Parses each `## Test Case N` block into ordered steps.
3. Launches a **Firefox** (headed) browser for each test case.
4. Executes each step, logging ✅ PASSED or ❌ FAILED to the console.
5. Captures a screenshot to `Screenshots/` on any failure.
6. Closes the browser after each test case.

---

### Step 6 — View Reports

After all test cases finish, an HTML report is written to `report.html` and a machine-readable JSON report to `report.json`.

Open the report in your browser:
```bash
open report.html
```

The report shows:
- Environment name and base URL
- Total steps, passed, and failed counts
- Per-test table with step number, step name, action, status, and error message

---

## Test Case Markdown DSL

Test case files follow a strict markdown structure understood by the parser.

```markdown
# Test Case: <Feature Name>

## Test Case 1: <Description>

1. Go to <URL> as "<Step Name>"
2. Enter "<value>" into "<locatorKey>" as "<Step Name>"
3. Click "<locatorKey>" as "<Step Name>"
4. Verify "<expectedText>" into "<locatorKey>" as "<Step Name>"
5. Select "<option>" from "<locatorKey>" as "<Step Name>"
6. Wait for <N> seconds as "<Step Name>"
7. PressSequentially "<value>" into "<locatorKey>" as "<Step Name>"

---

## Test Case 2: <Description>
...
```

- Each test case section starts with `##` and is separated by `---`.
- Every step ends with `as "<descriptive name>"`.
- The `as` label becomes the step name in the execution report.

### Supported Actions

| Keyword | Playwright Action | Description |
|---|---|---|
| `Go to <url>` | `page.goto()` | Navigate to a URL and wait for `networkidle` + `load` state |
| `Enter "<value>" into "<key>"` | `locator.fill()` | Clear and fill an input field |
| `PressSequentially "<value>" into "<key>"` | `locator.pressSequentially()` | Type character-by-character with 500ms delay (useful for autocomplete) |
| `Click "<key>"` | `locator.click()` | Click an element |
| `Select "<option>" from "<key>"` | `locator.selectOption()` | Select a `<select>` dropdown option by its visible label |
| `Verify "<text>" into "<key>"` | `locator.textContent()` | Assert the element's text contains the expected string |
| `Wait for <N> seconds` | `page.waitForTimeout()` | Pause execution for N seconds |

### Dynamic Placeholders

Use these tokens in step values for data-driven randomisation:

| Placeholder | Generates |
|---|---|
| `{{randomEmail}}` | Unique email e.g. `user1712345678@test.com` |
| `{{randomString}}` | Random 6-character alphanumeric string |
| `{{randomNumber}}` | Random 10-digit number |
| `{{randomFrom:val1,val2,val3}}` | One random value from the comma-separated list |
| `{{baseUrl}}` | Replaced with `env.baseUrl` from the active environment |
| `{{env.someKey}}` | Replaced with `someKey` from the active environment JSON |

**Example:**
```
Enter "{{randomEmail}}" into "emailField" as "Enter Random Email"
Select "{{randomFrom:Engineer,Doctor,Student}}" from "occupationDropdown" as "Select Occupation"
Go to {{baseUrl}}/client/#/auth/login as "Open Login Page"
```

### Selector Types

The `agent.ts` parser auto-detects the selector format from the locator string:

| Detected format | Resolved as |
|---|---|
| `getByRole(role, name)` | `page.getByRole(role, { name })` |
| `getByText(value)` | `page.getByText(value)` |
| `getByLabel(value)` | `page.getByLabel(value)` |
| `getByPlaceholder(value)` | `page.getByPlaceholder(value)` |
| Starts with `//` or `(//` or `xpath=` | `page.locator('xpath=...')` |
| Anything else | `page.locator(value)` (CSS) |

All role/text/label/placeholder locators use `.first()` to resolve to a single element.

---

## Environments

Three environments are pre-configured. Add more by creating a new JSON file in `environments/`.

| Environment | File | Base URL |
|---|---|---|
| dev | `environments/dev.json` | https://rahulshettyacademy.com |
| staging | `environments/staging.json` | https://rahulshettyacademy.com |
| prod | `environments/prod.json` | https://rahulshettyacademy.com |

Any key in the environment JSON can be referenced in test steps with `{{env.keyName}}`.

---

## Locators

Each locator file must match the base name (without extension) of its corresponding test case markdown file.

| Locator File | Test Case File |
|---|---|
| `locators/login.json` | `testcases/login.md` |
| `locators/registration.json` | `testcases/registration.md` |
| `locators/AddToCartAndCheckout.json` | `testcases/AddToCartAndCheckout.md` |

If no locator file is found for a given file, the agent falls back to an empty object (all locators will resolve to empty CSS selectors and steps will fail).

---

## Project Components

### `requirementToMd.ts` — AI Requirement Converter

Calls **OpenAI GPT-4o** with a strict system prompt that enforces the markdown DSL format. The model generates both positive (happy path) and negative (edge case/error) test scenarios automatically.

- Supports single file or `--folder` batch mode.
- Writes output to `testcases/<featureName>.md`.
- Requires the `OPENAI_API_KEY` environment variable.

---

### `agent.ts` — Markdown Parser & Model

`TestAgent` class responsible for:

| Method | Purpose |
|---|---|
| `readTestCase(filePath)` | Reads a `.md` file from disk |
| `splitTestCases(content)` | Splits content on `##` to isolate individual test cases |
| `loadLocators(fileName)` | Reads the matching JSON locators file |
| `loadEnv(envName)` | Reads the matching environment JSON file |
| `resolveEnvVars(value, env)` | Replaces `{{baseUrl}}` and `{{env.key}}` tokens |
| `generateRandomValue(value)` | Evaluates `{{random*}}` placeholders |
| `parseSelector(selector)` | Parses a locator string into a typed `ParsedSelector` |
| `parseStepsFromMD(content, locators, env)` | Converts MD lines into `Step[]` |
| `getTestCases(content, fileName, env)` | Full pipeline: returns `TestCase[]` ready for execution |

---

### `executor.ts` — Playwright Runner

`runSteps(steps, testName)`:

- Launches **Firefox** in headed (visible) mode with HTTPS errors ignored.
- Iterates over each step, resolving locators via `resolveLocator()`.
- On failure: captures a screenshot to `Screenshots/error-<testName>-step-<N>.png`.
- Accumulates results in the exported `globalReport` array.
- One browser instance per test case (launched and closed per call).

---

### `main.ts` — Orchestrator

1. Parses `--env <name>` CLI argument (default: `dev`).
2. Reads all `*out.md` files from `testcases/`.
3. For each file, parses all test cases and runs them sequentially via `runSteps`.
4. Calls `generateFinalReport()` to produce `report.html` and logs the summary.

---

## NPM Scripts

| Script | Command | Description |
|---|---|---|
| `npm start` | `ts-node main.ts --env dev` | Run all tests against dev environment |
| `npm run start:dev` | `ts-node main.ts --env dev` | Run against dev environment |
| `npm run start:staging` | `ts-node main.ts --env staging` | Run against staging environment |
| `npm run start:prod` | `ts-node main.ts --env prod` | Run against prod environment |
| `npm run generate` | `ts-node requirementToMd.ts` | Print usage for the AI generator |

---

## Prerequisites

| Dependency | Version | Purpose |
|---|---|---|
| Node.js | ≥ 18 | Runtime |
| TypeScript | ^6.0 | Language |
| ts-node | ^10.9 | Direct TS execution |
| @playwright/test | ^1.58 | Browser automation |
| openai | ^6.33 | GPT-4o API client |
| OPENAI_API_KEY | — | Required for `npm run generate` |

---

## Installation & Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd PlaywrightAutomationAgent

# 2. Install dependencies
npm install

# 3. Install Playwright browsers
npx playwright install firefox

# 4. Set your OpenAI API key (only needed for the AI generator)
export OPENAI_API_KEY=sk-your-key-here

# 5. (Optional) Generate test cases from requirements
npx ts-node requirementToMd.ts --folder requirements/

# 6. Run the tests
npm start
```

---

## Test Suites

Three test suites are included out of the box. All target **https://rahulshettyacademy.com**.

### Login (`testcases/login.md`)

| # | Test Case | Steps |
|---|---|---|
| 1 | Invalid Login | Navigate → Enter invalid email/password → Click Login → Verify error message |
| 2 | Valid Login | Navigate → Enter valid credentials → Click Login → Verify success toast |

**Locators:** `locators/login.json`

---

### Registration (`testcases/registration.md`)

| # | Test Case | Steps |
|---|---|---|
| 1 | Existing email registration | Navigate → Fill form with existing email → Submit → Verify duplicate email error |
| 2 | Weak password registration | Navigate → Fill form with weak password → Submit → Verify failure |
| 3 | Successful registration | Navigate → Fill form with all valid data + random email → Submit → Verify success |

Uses dynamic placeholders: `{{randomString}}`, `{{randomEmail}}`, `{{randomNumber}}`, `{{randomFrom:Engineer,Doctor,Student}}`.

**Locators:** `locators/registration.json`

---

### Add to Cart & Checkout (`testcases/AddToCartAndCheckout.md`)

| # | Test Case | Steps |
|---|---|---|
| 1 | Login → Add to cart → Checkout | Login → Verify toast → Add product to cart → Open cart → Checkout → Enter country → Place order |

Uses `{{env.validEmail}}` and `{{env.validPassword}}` from the active environment config.

**Locators:** `locators/AddToCartAndCheckout.json`
