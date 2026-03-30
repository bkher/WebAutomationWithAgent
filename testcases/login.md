# Test Case: Login Functionality

## Test Case 1: Invalid Login

1. Go to {{baseUrl}}/client/#/auth/login as "URL"
2. Enter "{{env.invalidEmail}}" into "emailField" as "Enter Email"
3. Enter "{{env.invalidPassword}}" into "passwordField" as "Enter Password"
4. Click "loginButton" as "Click Login"
5. Verify "Incorrect email or password." into "errorMessage" as "Verify Error Message"

---

## Test Case 2: Valid Login

1. Go to {{baseUrl}}/client/#/auth/login as "URL"
2. Enter "{{env.validEmail}}" into "emailField" as "Enter Email"
3. Enter "{{env.validPassword}}" into "passwordField" as "Enter Password"
4. Click "loginButton" as "Click Login"
5. Verify "Login Successfully" into "errorMessage" as "Verify Success Message"