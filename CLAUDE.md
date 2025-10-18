# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.5.6 application using the App Router architecture, React 19, TypeScript, and Tailwind CSS 4. The project uses Biome for linting and formatting instead of ESLint/Prettier.

## Development Commands

### Running the Development Server
```bash
npm run dev
```
Starts the Next.js development server with Turbopack enabled on http://localhost:3000

### Building for Production
```bash
npm run build
```
Creates an optimized production build using Turbopack

### Starting Production Server
```bash
npm start
```
Runs the production build (must run `npm run build` first)

### Linting
```bash
npm run lint
```
Runs Biome linter to check code quality and Next.js/React best practices

### Formatting
```bash
npm format
```
Formats code using Biome with 2-space indentation

## Project Structure

```
src/
  app/              # Next.js App Router pages and layouts
    layout.tsx      # Root layout with Geist font configuration
    page.tsx        # Home page component
    globals.css     # Global styles including Tailwind directives
    favicon.ico     # Site favicon
public/             # Static assets served from root
```

## Architecture Notes

### App Router (Next.js 15)
- Uses the `src/app` directory structure for file-based routing
- `layout.tsx` provides the root HTML structure and global font configuration
- `page.tsx` files define route UI
- Server Components by default (use 'use client' directive for Client Components)

### Fonts
- Uses Geist Sans and Geist Mono from `next/font/google`
- Font variables are applied in the root layout: `--font-geist-sans` and `--font-geist-mono`

### Styling
- Tailwind CSS 4 with the new `@tailwindcss/postcss` plugin
- PostCSS configuration in `postcss.config.mjs`
- Global styles in `src/app/globals.css`
- Font utilities use `font-sans` and `font-mono` classes

### TypeScript Configuration
- Path alias `@/*` maps to `./src/*` for cleaner imports
- Example: `import Component from '@/components/Component'`
- Strict mode enabled

### Biome Configuration
- Replaces ESLint and Prettier
- Enforces Next.js and React recommended rules
- VCS integration enabled with Git
- Ignores: `node_modules`, `.next`, `dist`, `build`
- Auto-organizes imports on save
- Custom rule: `noUnknownAtRules` disabled for CSS

## Key Dependencies

- **next**: 15.5.6 - Framework
- **react/react-dom**: 19.1.0 - UI library
- **tailwindcss**: ^4 - Styling
- **@biomejs/biome**: 2.2.0 - Linting and formatting
- **typescript**: ^5 - Type checking
