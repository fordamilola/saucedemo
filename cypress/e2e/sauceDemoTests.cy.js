describe('Sauce Demo Automation Tests', () => {
    beforeEach(() => {
      // Visit the login page before each test
      cy.visit('/')
    })
  
    // 1. Valid and Invalid Login Scenarios
    describe('Login Tests', () => {
      it('should login successfully with valid credentials (standard_user)', () => {
        cy.get('#user-name').type('standard_user')
        cy.get('#password').type('secret_sauce')
        cy.get('#login-button').click()
        cy.url().should('include', '/inventory.html') // Verify redirect to product page
        cy.get('.title').should('have.text', 'Products') // Verify page title
      })
  
      it('should fail to login with locked_out_user', () => {
        cy.get('#user-name').type('locked_out_user')
        cy.get('#password').type('secret_sauce')
        cy.get('#login-button').click()
        cy.get('[data-test="error"]').should('have.text', 'Epic sadface: Sorry, this user has been locked out.')
      })
  
      it('should fail to login with invalid username', () => {
        cy.get('#user-name').type('invalid_user')
        cy.get('#password').type('secret_sauce')
        cy.get('#login-button').click()
        cy.get('[data-test="error"]').should('have.text', 'Epic sadface: Username and password do not match any user in this service')
      })
  
      it('should fail to login with invalid password', () => {
        cy.get('#user-name').type('standard_user')
        cy.get('#password').type('wrong_password')
        cy.get('#login-button').click()
        cy.get('[data-test="error"]').should('have.text', 'Epic sadface: Username and password do not match any user in this service')
      })
  
      it('should fail to login with empty credentials', () => {
        cy.get('#login-button').click()
        cy.get('[data-test="error"]').should('have.text', 'Epic sadface: Username is required')
      })
  
      it('should fail to login with empty password', () => {
        cy.get('#user-name').type('standard_user')
        cy.get('#login-button').click()
        cy.get('[data-test="error"]').should('have.text', 'Epic sadface: Password is required')
      })
  
      // Negative Scenario: Test login with special characters (potential SQL injection)
      it('should fail to login with special characters in username', () => {
        cy.get('#user-name').type("admin' --")
        cy.get('#password').type('secret_sauce')
        cy.get('#login-button').click()
        cy.get('[data-test="error"]').should('have.text', 'Epic sadface: Username and password do not match any user in this service')
      })
  
      // Negative Scenario: Test login with very long username
      it('should fail to login with very long username', () => {
        const longUsername = 'a'.repeat(256) // 256 characters
        cy.get('#user-name').type(longUsername)
        cy.get('#password').type('secret_sauce')
        cy.get('#login-button').click()
        cy.get('[data-test="error"]').should('have.text', 'Epic sadface: Username and password do not match any user in this service')
      })
    })
  
    // 2. Valid and Invalid Scenarios for Adding Product and Checkout
    describe('Add Product and Checkout Tests', () => {
      beforeEach(() => {
        // Login as standard_user before each test in this suite
        cy.get('#user-name').type('standard_user')
        cy.get('#password').type('secret_sauce')
        cy.get('#login-button').click()
        cy.url().should('include', '/inventory.html')
      })
  
      it('should add a product to cart and complete checkout successfully', () => {
        // Add a product to cart
        cy.get('#add-to-cart-sauce-labs-backpack').click()
        cy.get('.shopping_cart_badge').should('have.text', '1') // Verify cart badge
  
        // Go to cart
        cy.get('.shopping_cart_link').click()
        cy.get('.cart_item').should('have.length', 1) // Verify 1 item in cart
  
        // Proceed to checkout
        cy.get('#checkout').click()
        cy.get('#first-name').type('John')
        cy.get('#last-name').type('Doe')
        cy.get('#postal-code').type('12345')
        cy.get('#continue').click()
  
        // Finish checkout
        cy.get('#finish').click()
        cy.get('.complete-header').should('have.text', 'Thank you for your order!')
      })
  
      it('should fail to checkout with missing first name', () => {
        // Add a product to cart
        cy.get('#add-to-cart-sauce-labs-backpack').click()
        cy.get('.shopping_cart_link').click()
  
        // Proceed to checkout
        cy.get('#checkout').click()
        cy.get('#last-name').type('Doe')
        cy.get('#postal-code').type('12345')
        cy.get('#continue').click()
  
        // Verify error
        cy.get('[data-test="error"]').should('have.text', 'Error: First Name is required')
      })
  
      it('should fail to checkout with missing postal code', () => {
        // Add a product to cart
        cy.get('#add-to-cart-sauce-labs-backpack').click()
        cy.get('.shopping_cart_link').click()
  
        // Proceed to checkout
        cy.get('#checkout').click()
        cy.get('#first-name').type('John')
        cy.get('#last-name').type('Doe')
        cy.get('#continue').click()
  
        // Verify error
        cy.get('[data-test="error"]').should('have.text', 'Error: Postal Code is required')
      })
  
      // Add product after logging out
      it('should fail to add product to cart after logging out', () => {
        // Add a product to cart
        cy.get('#add-to-cart-sauce-labs-backpack').click()
        cy.get('.shopping_cart_badge').should('have.text', '1')
  
        // Log out
        cy.get('#react-burger-menu-btn').click()
        cy.get('#logout_sidebar_link').click()
        cy.url().should('eq', 'https://www.saucedemo.com/')
  
        // Attempt to visit inventory page after logging out
        cy.visit('/inventory.html', { failOnStatusCode: false }) // Allow non-2xx status codes
        cy.url().should('eq', 'https://www.saucedemo.com/') // Verify redirect to login page
        cy.get('#user-name').should('be.visible') // Verify we're on the login page
      })
  
      // Checkout with empty cart
      it('should handle checkout with empty cart', () => {
        // Go to cart without adding any products
        cy.get('.shopping_cart_link').click()
        cy.get('.cart_item').should('not.exist') // Verify cart is empty
  
        // Proceed to checkout
        cy.get('#checkout').click()
        cy.get('#first-name').type('John')
        cy.get('#last-name').type('Doe')
        cy.get('#postal-code').type('12345')
        cy.get('#continue').click()
  
        // Verify checkout overview page shows no items
        cy.get('.cart_item').should('not.exist')
        cy.get('#finish').click()
        cy.get('.complete-header').should('have.text', 'Thank you for your order!') // Checkout completes but with no items
      })
  
      // Negative Scenario: Checkout with invalid zip code format
      it('should fail to checkout with invalid zip code format', () => {
        // Add a product to cart
        cy.get('#add-to-cart-sauce-labs-backpack').click()
        cy.get('.shopping_cart_link').click()
  
        // Proceed to checkout
        cy.get('#checkout').click()
        cy.get('#first-name').type('John')
        cy.get('#last-name').type('Doe')
        cy.get('#postal-code').type('ABCDE') // Invalid format (letters instead of numbers)
        cy.get('#continue').click()
  
        // Although, Sauce Demo does not validate zip code format, so this will pass through
        // Verify that checkout proceeds (this is a potential bug in the application)
        cy.url().should('include', '/checkout-step-two.html')
        cy.get('#finish').click()
        cy.get('.complete-header').should('have.text', 'Thank you for your order!')
      })
  
      // Negative Scenario: Add product and remove it, then attempt checkout
      it('should handle checkout after removing all products from cart', () => {
        // Add a product to cart
        cy.get('#add-to-cart-sauce-labs-backpack').click()
        cy.get('.shopping_cart_badge').should('have.text', '1')
  
        // Go to cart and remove the product
        cy.get('.shopping_cart_link').click()
        cy.get('#remove-sauce-labs-backpack').click()
        cy.get('.cart_item').should('not.exist') // Verify cart is empty
  
        // Proceed to checkout
        cy.get('#checkout').click()
        cy.get('#first-name').type('John')
        cy.get('#last-name').type('Doe')
        cy.get('#postal-code').type('12345')
        cy.get('#continue').click()
  
        // Verify checkout overview page shows no items
        cy.get('.cart_item').should('not.exist')
        cy.get('#finish').click()
        cy.get('.complete-header').should('have.text', 'Thank you for your order!')
      })
  
  
    })
  })