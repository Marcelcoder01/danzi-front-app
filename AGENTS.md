# Repository Guidelines

## Project Structure & Module Organization

This repository is an Angular 21 standalone application. Application code lives in `src/app`: global services and guards are in `core/`, reusable UI and layouts in `shared/`, authentication pages in `auth/`, and product features in `pages/` (attendance, classes, students, and others). Keep feature-specific services, interfaces, and components beside their feature. Global styles are in `src/styles.css`; images, video, and environment settings are in `src/assets/` and `src/environments/`. `ARQUITECTURA.md` has additional architecture notes.

## Build, Test, and Development Commands

Use the npm scripts defined in `package.json`:

- `npm start` runs the Angular development server at `http://localhost:4200`.
- `npm run build` creates the production build in `dist/`.
- `npm test` runs the unit tests with Angular's Vitest integration.
- `npm run watch` rebuilds continuously with development settings.

## Coding Style & Naming Conventions

Follow `.editorconfig`: UTF-8, two spaces, and final newlines. Prettier uses single quotes and a 100-character print width, with Angular parsing for HTML. Use Angular CLI conventions: PascalCase class names (`StudentsComponent`), camelCase members (`loadStudents`), and kebab-case feature/file names (`student-dialog`). Keep templates and styles in their component `.html` and `.css` files where that pattern exists. Use `app` as the component selector prefix.

## Testing Guidelines

Tests use Vitest and are colocated with their code as `*.spec.ts`, for example `src/app/pages/attendance/attendance.component.spec.ts`. Add or update focused specs for changed behavior, and run `npm test` before submitting. Run `npm run build` to catch TypeScript and production compilation errors.

## Commit & Pull Request Guidelines

Recent history uses short imperative summaries, often with Conventional Commit prefixes such as `feat:`, `fixes`, and `test:`; prefer `type: concise description` (for example, `feat(attendance): add monthly filters`). Keep commits focused. Pull requests should explain the user-visible change, link related issues when available, and include screenshots for UI changes. Mention relevant build or test commands and their results.

## Security & Configuration

Never commit real credentials or service keys. Keep environment-specific configuration in the existing environment files and use local, non-production values for development.
