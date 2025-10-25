# Frontend cypress/e2e/dashboard.cy.ts
describe('Student Dashboard', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should display dashboard metrics', () => {
    cy.contains('My Dashboard').should('be.visible');
    cy.contains('Enrolled Courses').should('be.visible');
    cy.contains('Lessons Completed').should('be.visible');
    cy.contains('Quizzes Taken').should('be.visible');
    cy.contains('Average Score').should('be.visible');
  });

  it('should display course cards', () => {
    cy.contains('My Courses').should('be.visible');
    cy.contains('Introduction to Machine Learning').should('be.visible');
    cy.contains('Dr. Sarah Chen').should('be.visible');
  });

  it('should display upcoming quizzes', () => {
    cy.contains('Upcoming Quizzes').should('be.visible');
    cy.contains('Supervised Learning').should('be.visible');
  });

  it('should navigate to course detail when clicking continue', () => {
    cy.get('button').contains('Continue').first().click();
    cy.url().should('include', '/courses/');
  });

  it('should navigate to quiz preparation when clicking prepare', () => {
    cy.get('button').contains('Prepare').first().click();
    cy.url().should('include', '/quiz/');
  });

  it('should be responsive on mobile', () => {
    cy.viewport(375, 667);
    cy.contains('My Dashboard').should('be.visible');
    cy.contains('Enrolled Courses').should('be.visible');
  });
});
