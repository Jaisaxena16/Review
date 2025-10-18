# Frontend Tests

This directory contains comprehensive unit tests for the TypeScript/React frontend code.

## Test Files

- **lib/api.test.ts**: Tests for API client functions
  - Covers all API endpoints (products, reviews, predictions)
  - Tests error handling and edge cases
  - Validates request formatting and response parsing

- **utils/sentimentAnalysis.test.ts**: Tests for sentiment analysis utility
  - Tests backend API integration
  - Tests fallback heuristic logic
  - Covers positive/negative keyword detection
  - Tests rating influence on predictions

- **components/ClothingCard.test.tsx**: Tests for ClothingCard component
  - Tests rendering of product information
  - Tests rating display logic
  - Tests click interactions
  - Tests edge cases (null ratings, 0 reviews, etc.)

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run specific test file
npm test api.test.ts
```

## Test Coverage

The tests aim for comprehensive coverage including:
- Happy path scenarios
- Edge cases and error conditions
- Input validation
- State management
- User interactions
- API error handling
- Fallback behaviors

## Writing New Tests

1. Create test file next to the source file or in `src/__tests__/`
2. Use descriptive test names that explain what is being tested
3. Follow the Arrange-Act-Assert pattern
4. Mock external dependencies (fetch, router, etc.)
5. Test both success and failure scenarios
6. Include edge case tests