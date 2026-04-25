# Contributing to Kael Auth Service

Thanks for your interest in contributing.

## Ways to Contribute

- Report bugs
- Propose features
- Improve documentation
- Submit code improvements and tests

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create your env file:
   ```bash
   cp .env.example .env
   ```
3. Generate keys:
   ```bash
   npm run gen:keys
   ```
4. Run migrations:
   ```bash
   npm run db:migrate
   ```
5. Start local development:
   ```bash
   npm run dev:all
   ```

## Branching and Pull Requests

- Create a feature branch from `main`
- Keep changes focused and reviewable
- Include tests for behavior changes when possible
- Update docs/OpenAPI when request or response contracts change
- Open a pull request with:
  - Problem statement
  - Proposed solution
  - Testing evidence
  - Any migration or rollout notes

## Commit Guidelines

Use clear, imperative commit messages.

Examples:

- `fix(auth): handle expired refresh token`
- `feat(oauth): add organization provider callback validation`
- `docs: document local worker bootstrap`

## Code Style

- Keep modules small and cohesive
- Prefer explicit naming over short abbreviations
- Validate external input at boundaries
- Avoid introducing breaking API changes without documenting them

## Running Tests

```bash
npm test
```

## Reporting Security Issues

Do not open public issues for vulnerabilities.

See `SECURITY.md` for responsible disclosure instructions.
