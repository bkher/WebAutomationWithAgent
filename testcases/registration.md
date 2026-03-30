# Test Case: Registration Functionality

## Test Case 1: Use existing email for registration

1. Go to https://rahulshettyacademy.com/client/#/auth/login as "Open Login Page"
2. Click "registerLink" as "Click Register Link"
3. Enter "{{randomString}}" into "firstNameField" as "Enter First Name"
4. Enter "{{randomString}}" into "lastNameField" as "Enter Last Name"
5. Enter "testuser12@email.com" into "emailField" as "Enter Email"
6. Enter "{{randomNumber}}" into "mobileField" as "Enter Mobile Number"
7. Enter "Pass1234$" into "passwordField" as "Enter Password"
8. Enter "Pass1234$" into "confirmPasswordField" as "Confirm Password"
9. Select "{{randomFrom:Engineer,Doctor,Student}}" from "occupationDropdown" as "Select Occupation"
10. Click "termsCheckbox" as "Accept Terms"
11. Click "genderFemale" as "Select Gender"
12. Click "registerButton" as "Click Register"
13. Verify "User already exisits with this Email Id!" into "toastMessage" as "Verify Existing Email Error"

---

## Test Case 2: Invalid password for registration

1. Go to https://rahulshettyacademy.com/client/#/auth/login as "Open Login Page"
2. Click "registerLink" as "Click Register Link"
3. Enter "{{randomString}}" into "firstNameField" as "Enter First Name"
4. Enter "{{randomString}}" into "lastNameField" as "Enter Last Name"
5. Enter "{{randomEmail}}" into "emailField" as "Enter Email"
6. Enter "{{randomNumber}}" into "mobileField" as "Enter Mobile Number"
7. Enter "pass1234" into "passwordField" as "Enter Invalid Password"
8. Enter "pass1234" into "confirmPasswordField" as "Confirm Invalid Password"
9. Select "{{randomFrom:Engineer,Doctor,Student}}" from "occupationDropdown" as "Select Occupation"
10. Click "termsCheckbox" as "Accept Terms"
11. Click "genderFemale" as "Select Gender"
12. Click "registerButton" as "Click Register"
13. Verify "Registration successful" into "toastMessage" as "Verify Registration Response"

---

## Test Case 3: Successful registration

1. Go to https://rahulshettyacademy.com/client/#/auth/login as "Open Login Page"
2. Click "registerLink" as "Click Register Link"
3. Enter "{{randomString}}" into "firstNameField" as "Enter First Name"
4. Enter "{{randomString}}" into "lastNameField" as "Enter Last Name"
5. Enter "{{randomEmail}}" into "emailField" as "Enter Email"
6. Enter "{{randomNumber}}" into "mobileField" as "Enter Mobile Number"
7. Enter "Pass1234$" into "passwordField" as "Enter Password"
8. Enter "Pass1234$" into "confirmPasswordField" as "Confirm Password"
9. Select "{{randomFrom:Engineer,Doctor,Student}}" from "occupationDropdown" as "Select Occupation"
10. Click "termsCheckbox" as "Accept Terms"
11. Click "genderFemale" as "Select Gender"
12. Click "registerButton" as "Click Register"
13. Verify "Registered Successfully" into "toastMessage" as "Verify Success Message"