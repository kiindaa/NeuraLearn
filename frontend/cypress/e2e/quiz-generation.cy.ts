# Frontend cypress/e2e/quiz-generation.cy.ts
describe('AI Quiz Generation', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/quiz/generate');
  });

  it('should display quiz generation interface', () => {
    cy.contains('AI Quiz Generation').should('be.visible');
    cy.contains('Lesson Selection').should('be.visible');
    cy.contains('Quiz Configuration').should('be.visible');
  });

  it('should allow lesson selection', () => {
    cy.get('input[type="checkbox"]').first().check();
    cy.get('input[type="checkbox"]').first().should('be.checked');
  });

  it('should allow difficulty selection', () => {
    cy.get('input[value="easy"]').check();
    cy.get('input[value="easy"]').should('be.checked');
    
    cy.get('input[value="hard"]').check();
    cy.get('input[value="hard"]').should('be.checked');
  });

  it('should allow question type selection', () => {
    cy.get('input[value="multiple_choice"]').check();
    cy.get('input[value="multiple_choice"]').should('be.checked');
    
    cy.get('input[value="short_answer"]').check();
    cy.get('input[value="short_answer"]').should('be.checked');
  });

  it('should generate quiz when clicking generate button', () => {
    cy.get('button').contains('Generate Quiz').click();
    cy.contains('Generating Quiz...').should('be.visible');
    
    // Wait for generation to complete
    cy.wait(3000);
    cy.contains('AI-Generated Practice Questions').should('be.visible');
  });

  it('should display generated questions', () => {
    cy.get('button').contains('Generate Quiz').click();
    cy.wait(3000);
    
    // Should show generated questions
    cy.get('[data-testid="question-card"]').should('have.length.greaterThan', 0);
  });

  it('should allow answering questions', () => {
    cy.get('button').contains('Generate Quiz').click();
    cy.wait(3000);
    
    // Answer a multiple choice question
    cy.get('input[type="radio"]').first().check();
    
    // Check answer
    cy.get('button').contains('Check Answer').first().click();
  });
});
