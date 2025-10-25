# Frontend cypress/e2e/login.cy.ts
describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display login form', () => {
    cy.contains('Welcome Back').should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should switch between login and signup tabs', () => {
    cy.get('button').contains('Sign Up').click();
    cy.url().should('include', '/signup');
    
    cy.get('button').contains('Login').click();
    cy.url().should('include', '/login');
  });

  it('should login successfully with valid credentials', () => {
    cy.login();
    cy.url().should('include', '/dashboard');
    cy.contains('My Dashboard').should('be.visible');
  });

  it('should show error with invalid credentials', () => {
    cy.get('input[name="email"]').type('invalid@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    // Should show error message
    cy.contains('Invalid credentials').should('be.visible');
  });

  it('should validate required fields', () => {
    cy.get('button[type="submit"]').click();
    
    // Should show validation errors
    cy.get('input[name="email"]').should('have.attr', 'required');
    cy.get('input[name="password"]').should('have.attr', 'required');
  });
});
