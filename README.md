# Freshly Frontend

React Native mobile app built with Expo and Expo Router.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Code Quality](#code-quality)
- [CI Pipeline](#ci-pipeline)
- [Contribution Guidelines](#contribution-guidelines)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.81 + Expo SDK 54 |
| Routing | Expo Router v6 (file-based) |
| Language | TypeScript (strict mode) |
| Linting | ESLint + eslint-config-expo |
| Formatting | Prettier |
| CI | GitHub Actions |

---

## Prerequisites

Make sure the following are installed before you begin:

- **Node.js** 20+ — [nodejs.org](https://nodejs.org)
- **npm** 10+ (comes with Node)
- **Expo CLI** — installed automatically via `npx`
- **iOS Simulator** (macOS only) — requires Xcode from the App Store
- **Android Emulator** — requires [Android Studio](https://developer.android.com/studio)

For physical device testing, install **Expo Go** from the App Store or Google Play.

---

## Getting Started

### 1. Clone the repository

```sh
git clone <repo-url>
cd freshly-frontend
```

### 2. Install dependencies

```sh
npm install
```

### 3. Set up environment variables

```sh
cp .env.example .env
```

Fill in the values in `.env` (see [Environment Configuration](#environment-configuration)).

### 4. Start the development server

```sh
npm start
```

Then press:
- `i` to open the iOS simulator
- `a` to open the Android emulator
- `w` to open in the browser
- Scan the QR code with Expo Go on a physical device

---

## Environment Configuration

Environment variables are loaded via Expo's built-in support. Variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the app.

| Variable | Description | Example |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL for the backend API | `http://localhost:3000` |

Create a `.env` file at the project root:

```sh
EXPO_PUBLIC_API_URL=http://localhost:3000
```

> `.env` is gitignored. Never commit secrets or API keys.

For different environments (staging, production), use:

```sh
.env.development   # local dev
.env.staging       # staging builds
.env.production    # production builds
```

---


## Available Scripts

| Script | Command | Description |
|---|---|---|
| `start` | `npm start` | Start the Expo dev server |
| `ios` | `npm run ios` | Start and open iOS simulator |
| `android` | `npm run android` | Start and open Android emulator |
| `web` | `npm run web` | Start and open in browser |
| `lint` | `npm run lint` | Run ESLint + Prettier checks |
| `format` | `npm run format` | Auto-format all source files |

---

## Code Quality

### ESLint

Configured with `eslint-config-expo` (flat config format). Runs automatically in CI.

```sh
npm run lint          # check for violations
npm run lint -- --fix # auto-fix where possible
```

### Prettier

Formatting rules in `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

```sh
npm run format   # rewrite files to match rules
npm run lint     # also catches formatting errors via eslint-plugin-prettier
```

### TypeScript

Strict mode is enabled. Run a type check without emitting files:

```sh
npx tsc --noEmit
```

### VS Code (recommended setup)

Install the following extensions:
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

---

## CI Pipeline

GitHub Actions runs on every push and pull request to all branches.

**Jobs:**

| Step | What it checks |
|---|---|
| Type check | `tsc --noEmit` — TypeScript errors |
| Lint | `npm run lint` — ESLint rules + Prettier violations |
| Format check | `prettier --check` — unformatted files |

The pipeline must pass before a PR can be merged.

---

## Contribution Guidelines

### Branch naming

```
<type>/<ticket-id>-short-description

feat/FRES-42-add-login-screen
fix/FRES-99-fix-api-timeout
chore/FRES-10-update-dependencies
```

Types: `feat`, `fix`, `chore`, `refactor`, `docs`

### Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

feat(auth): add login screen
fix(api): handle 401 response correctly
chore(deps): update expo to SDK 55
```

### Pull request process

1. Branch off from `main`
2. Make your changes — keep PRs focused on a single concern
3. Ensure `npm run lint` and `npx tsc --noEmit` pass locally before pushing
4. Open a PR with a clear description of what changed and why
5. Address review feedback
6. Merge once approved and CI is green
```
