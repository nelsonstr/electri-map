# Electri-Map Workspace Rules

## Overview

This document establishes the comprehensive rules, standards, and best practices for the Electri-Map project. All team members and AI assistants must adhere to these guidelines to ensure code quality, maintainability, security, and consistent development practices across the project.

Electri-Map is a Next.js 16 mapping application for electrical infrastructure management, built with TypeScript, Tailwind CSS 3.4, Radix UI, Leaflet/React-Leaflet, Supabase (PostgreSQL), and next-intl for internationalization. The application serves multiple domains including mapping and location services, emergency response systems, maintenance management, support systems, resource management, and civic engagement.

## Core Development Rules

### 1. Code Quality Standards

All code must meet the highest quality standards to ensure long-term maintainability and scalability. The project uses TypeScript 5.x with strict mode enabled, and all code must compile without type errors. ESLint and Prettier are configured for code formatting and linting, and all code must pass linting checks before being committed to the repository.

Every function, component, and service must have explicit type signatures. Implicit any types are strictly prohibited, and all props interfaces must be defined for React components. Use discriminated unions for union types to enable proper type narrowing and reduce runtime errors.

The codebase follows a feature-based folder structure that organizes code by domain functionality rather than file type. Each feature module should be self-contained with its own components, services, hooks, types, and tests co-located within the feature directory. This approach improves code discoverability, reduces coupling between features, and makes it easier to understand and modify feature-specific code.

### 2. File Organization and Naming Conventions

The project follows consistent naming conventions to ensure predictability and ease of navigation. Component files use PascalCase (e.g., `EmergencyDashboard.tsx`), while utility files use kebab-case (e.g., `use-mobile.tsx`). All files must use the `.tsx` extension for React components with JSX and `.ts` for pure TypeScript files.

The directory structure must follow this pattern: components organized by feature in `components/feature-name/`, with each feature directory containing an `index.ts` for public exports, `types.ts` for feature-specific types, and component files that are named descriptively (e.g., `sos-button.tsx`, `alert-notification.tsx`).

Service files reside in `lib/services/feature-name/` and follow the same organizational pattern. Each service file should have a corresponding test file with the `.test.ts` extension. TypeScript type definitions are centralized in the `types/` directory with domain-specific subdirectories (e.g., `types/emergency/`, `types/support/`).

### 3. Git Workflow and Version Control

The project follows GitFlow-inspired branching conventions with main, develop, feature/, hotfix/, and release/ branches. Feature branches should be created from develop and named descriptively using kebab-case (e.g., feature/emergency-sos-button, feature/support-ticket-system).

All commits must follow conventional commit message format: `type(scope): description` where type is one of feat, fix, docs, style, refactor, perf, test, or chore. This enables automated changelog generation and semantic versioning.

Pull requests require at least one review approval before merging. All CI/CD checks must pass including linting, type checking, and test execution. Feature branches should be regularly rebased onto develop to avoid integration conflicts.

### 4. Component Development Standards

React components must follow a layered architecture that separates presentation from business logic. Presentational components focus solely on rendering UI and receiving data through props, containing no business logic, data fetching, or state management. These components are highly reusable and easily testable because their behavior is purely a function of their inputs.

Container components handle data fetching, state management, and pass data to presentational components. They serve as the bridge between the service layer and the UI layer, orchestrating the data flow and managing the component lifecycle. Container components should be minimal, delegating rendering logic entirely to presentational components.

All components must be accessible, using proper ARIA attributes, keyboard navigation support, and semantic HTML. Components must be responsive and work across all supported viewport sizes. Use Tailwind CSS utility classes for styling, following the design system tokens for colors, spacing, and typography.

### 5. API and Service Layer Rules

All backend operations must go through the service layer, never directly from components. Services encapsulate business logic, data access operations, and error handling. Each service should have a single responsibility, focusing on one domain area.

Supabase client instances should be created using the centralized utilities in `lib/supabase/`. Server-side operations use the server client, while client-side operations use the browser client. Never expose Supabase credentials or service role keys on the client side.

All API routes in `app/api/` must include proper authentication and authorization checks. Use the middleware utilities for session validation and role-based access control. Input validation using Zod schemas is required for all API endpoints to prevent injection attacks and ensure data integrity.

Error handling must be consistent across all services. Functions should throw descriptive errors that can be caught and handled appropriately. Log errors appropriately without exposing sensitive information to clients.

## Testing Requirements

### 1. Unit Testing Standards

All business logic functions must have corresponding unit tests with at least 80% code coverage. Tests follow the Arrange-Act-Assert pattern with clear separation between test setup, execution, and verification. Use Vitest as the testing framework with React Testing Library for component tests.

Mock external dependencies including Supabase clients, external APIs, and time-dependent functions. Use factory functions for creating test data to maintain test readability and reduce duplication. Tests must be isolated and not depend on execution order or shared state.

### 2. Component Testing Requirements

All React components must have corresponding tests that verify rendering and user interactions. Tests should use React Testing Library with queries that reflect how users interact with the application (by role, text content, or label). Avoid testing implementation details that may change without affecting user-facing behavior.

Component tests should verify accessibility compliance, including keyboard navigation and ARIA attribute presence. Test loading states, error states, and empty states in addition to the happy path. Mock data should reflect realistic scenarios including edge cases.

### 3. Integration Testing

API endpoints require integration tests that verify request/response handling, authentication, and authorization. Database operations should be tested with real database connections in integration test environments. End-to-end tests cover critical user journeys including emergency response flows.

## Internationalization Guidelines

The project uses next-intl for internationalization with translations stored in `i18n/` and `messages/` directories. All user-facing text must be externalized and not hardcoded in components. Use the translation hook pattern: `const { t } = useTranslations()` for accessing localized strings.

Message keys must follow a consistent naming convention using dot notation: `component.section.key` (e.g., `emergency.sos.activateButton`). Support pluralization, gender-specific strings, and parameterized messages where needed.

Date, time, and number formatting must use the appropriate locale-aware formatters from the intl utilities. Right-to-left (RTL) language support must be considered in component layout and styling.

## Performance Optimization

### 1. Frontend Performance

All components must be optimized for performance from the start. Use React.lazy() and Suspense for code splitting routes and heavy components. Implement proper memoization using useMemo and useCallback to prevent unnecessary re-renders.

Images and static assets must be optimized and lazy-loaded where appropriate. Use Next.js Image component with appropriate sizing and format selection. Implement virtual scrolling for long lists using libraries like react-virtual.

### 2. Backend Performance

Database queries must include appropriate indexes and use query optimization techniques. Avoid N+1 queries by using Supabase's relational query capabilities and select optimization. Implement pagination for all list endpoints to limit response size.

Caching strategies must be implemented for frequently accessed, rarely changing data. Use appropriate cache invalidation patterns to ensure data freshness. Monitor query performance and optimize slow queries proactively.

## Security Guidelines

### 1. Authentication and Authorization

All protected routes and API endpoints must verify user authentication before processing requests. Use the centralized auth utilities from `lib/supabase/auth` for session management. Implement role-based access control (RBAC) for features with different permission levels.

Never bypass security checks for convenience or to fix bugs. All authentication and authorization decisions must be logged for audit purposes. Session management must follow security best practices including proper token storage and refresh handling.

### 2. Data Protection

All user data must be handled according to privacy regulations. Personally identifiable information (PII) must be encrypted at rest and in transit. Never log sensitive information including passwords, tokens, or personal data.

Use Supabase Row Level Security (RLS) policies for fine-grained access control. Environment variables must be used for all secrets, API keys, and sensitive configuration. Never commit secrets to version control.

### 3. Input Validation and Sanitization

All inputs from users or external systems must be validated before processing. Use Zod schemas for comprehensive input validation in forms and API endpoints. Implement proper sanitization to prevent XSS and injection attacks.

Content Security Policy (CSP) headers must be configured appropriately. Use parameterized queries for all database operations to prevent SQL injection. Validate file uploads and limit accepted file types.

## Accessibility Requirements

### 1. WCAG Compliance

All components must meet WCAG 2.1 Level AA compliance requirements. This includes providing text alternatives for non-text content, ensuring keyboard accessibility, maintaining color contrast ratios, and supporting screen readers.

Use semantic HTML elements appropriately (header, nav, main, footer, article, section). All interactive elements must be keyboard accessible with visible focus indicators. Form inputs must have associated labels with proper for/id attributes.

### 2. Assistive Technology Support

ARIA attributes must be used correctly to enhance screen reader experience. Live regions must be implemented for dynamic content updates. Test with multiple browsers and assistive technologies to ensure broad compatibility.

Provide skip navigation links and landmarks for easy page traversal. Ensure that content order is logical regardless of visual presentation. Test with keyboard-only navigation regularly.

## Deployment and DevOps

### 1. Environment Management

The project maintains multiple environments: development, staging, and production. Environment-specific configuration uses environment variables with proper validation. Never use production credentials in development or staging environments.

Database migrations must be tested in staging before deployment to production. Maintain backward compatibility in database schemas to enable zero-downtime deployments. Use feature flags for gradual rollouts and quick rollbacks.

### 2. CI/CD Pipeline

All commits must pass the CI pipeline before merging. The pipeline includes linting, type checking, unit tests, integration tests, and build verification. Pull requests require successful CI checks before approval.

Deployment to production requires manual approval and follows a staged rollout process. Monitor application health and performance metrics during and after deployment. Have rollback procedures documented and tested.

## Code Review Checklist

Before submitting code for review, ensure all of the following are complete. Code must pass ESLint without warnings and be formatted with Prettier. No console.log statements should remain in production code. All functions must have appropriate type signatures.

Complex logic must be documented with JSDoc comments explaining the approach and rationale. Unit tests must be added for all new functions with coverage meeting the 80% target. Component tests must be added for all new UI components.

Security checks must confirm no hardcoded secrets or API keys. User input validation must be in place for all inputs. Authentication checks must be present for protected routes.

Documentation updates must accompany all new feature modules. README files should explain purpose, key functions, and integration points. Breaking changes must be clearly documented.

## Component Documentation Standards

All components must include comprehensive documentation to aid future developers and maintainers. The documentation should explain the component's purpose, props interface with descriptions, usage examples, and any important implementation notes.

```tsx
/**
 * Emergency SOS Button Component
 * 
 * Provides a one-tap mechanism for users to send emergency alerts.
 * Features biometric confirmation requirement and real-time status updates.
 * 
 * @example
 * ```tsx
 * <SOSButton
 *   onActivate={handleSOS}
 *   disabled={!isAuthenticated}
 *   showStatus={true}
 * />
 * ```
 */
export function SOSButton({ 
  /** Callback when SOS is activated */
  onActivate: () => Promise<void>,
  /** Disable the button */
  disabled?: boolean,
  /** Show activation status */
  showStatus?: boolean
}: SOSButtonProps) {
  // Implementation
}
```

## Database Schema Conventions

All database tables use snake_case naming for columns and PostgreSQL conventions. Tables include created_at and updated_at timestamps with proper timezone handling. Soft delete patterns use deleted_at timestamps instead of physical deletion.

Primary keys use UUIDs generated client-side where appropriate. Foreign key relationships are properly defined with appropriate cascade rules. Indexes are created for frequently queried columns and foreign keys.

Row Level Security (RLS) policies are implemented for all tables with user data. Migration files are named with timestamps and include both up and down migrations. Schema changes are backward compatible when possible.

## Emergency Response Features

Emergency response features receive special consideration due to their critical nature. These features must be highly available and performant under load. Fallback mechanisms must be in place for when external services are unavailable.

User safety is the highest priority in feature conflicts. When in doubt about feature trade-offs, prioritize features that help users in emergency situations. Test emergency flows thoroughly including error scenarios and recovery.

## Conclusion

These rules establish the foundation for consistent, high-quality development on the Electri-Map project. All team members are responsible for following these guidelines and proposing improvements when necessary. Regular reviews of these rules ensure they remain relevant and effective.

The rules should be updated as the project evolves and new best practices emerge. Changes to these rules require review and approval from the engineering team lead. Questions about rule interpretation should be directed to senior team members.

## Document Version

**Version:** 1.0  
**Last Updated:** February 2026  
**Author:** Electri-Map Development Team
