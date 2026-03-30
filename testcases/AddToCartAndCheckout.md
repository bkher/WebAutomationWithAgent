# Test Case: Add to cart and checkout

## Test Case 1: Login and add product to cart and checkout

1. Go to {{env.baseUrl}}/client/#/auth/login as "Open Login Page"
2. Enter "{{env.validEmail}}" into "emailField" as "Enter Email"
3. Enter "{{env.validPassword}}" into "passwordField" as "Enter Password"
4. Click "loginButton" as "Click Login"
5. Verify "Login Successfully" into "toastMessage" as "Verify Login Success"
6. Click "addToCartButton" as "Add Product To Cart"
7. Click "cartButton" as "Open Cart"
8. Click "checkoutButton" as "Click Checkout"
9. PressSequentially "India" into "countryInput" as "Enter Country"
10. Click "countryOptionIndia" as "Select India"
11. Click "Place Order" into "placeOrderLink" as "Click Place Order"