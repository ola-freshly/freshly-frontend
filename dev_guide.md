# Developer Guide — From Zero to Mobile App

> Written for someone who is **brand new** to mobile development. If you don't understand something, keep reading. Every concept here is used over and over in real apps.

---

## Table of Contents

1. [Mindset — How to Learn This Stuff](#mindset--how-to-learn-this-stuff)
2. [The Big Picture — What Are We Building?](#the-big-picture--what-are-we-building)
3. [Concept 1: TypeScript — The Safety Net](#concept-1-typescript--the-safety-net)
4. [Concept 2: React Components — The Building Blocks](#concept-2-react-components--the-building-blocks)
5. [Concept 3: State & Effects — Making Things Happen](#concept-3-state--effects--making-things-happen)
6. [Concept 4: React Native Layout — Putting Stuff on Screen](#concept-4-react-native-layout--putting-stuff-on-screen)
7. [Concept 5: Expo Router — Moving Between Screens](#concept-5-expo-router--moving-between-screens)
8. [Concept 6: Axios & API Calls — Talking to a Server](#concept-6-axios--api-calls--talking-to-a-server)
9. [Concept 7: Auth & Token Storage — Login Stuff](#concept-7-auth--token-storage--login-stuff)
10. [Concept 8: Error Handling — When Things Break](#concept-8-error-handling--when-things-break)
11. [Concept 9: Project Structure — Where to Put Files](#concept-9-project-structure--where-to-put-files)
12. [Concept 10: Config & Environment — Settings That Change](#concept-10-config--environment--settings-that-change)
13. [Concept 11: Code Quality Tools — Linters & Formatters](#concept-11-code-quality-tools--linters--formatters)
14. [Concept 12: CI/CD — Automatic Checks](#concept-12-cicd--automatic-checks)
15. [How to Add a New Screen — Step by Step](#how-to-add-a-new-screen--step-by-step)
16. [Glossary — Words You'll Hear Every Day](#glossary--words-youll-hear-every-day)

---

## Mindset — How to Learn This Stuff

Before anything technical, here's how to approach learning mobile development.

### The 80/20 Rule

20% of the concepts do 80% of the work. In this codebase, those concepts are:
- TypeScript (basic types, interfaces, generics)
- React (components, `useState`, `useEffect`)
- React Native (`View`, `Text`, `StyleSheet`, Flexbox)
- API calls (Axios, async/await, try/catch)
- Navigation (Expo Router)

Focus on those first. Everything else you can Google when you need it.

### Don't Memorize — Recognize

You don't need to remember syntax. You need to **recognize patterns** so you know what to Google. For example:
- "Oh, this component uses `useState` to track something" → you know the pattern
- "Oh, this API call happens when the screen loads" → you know `useEffect` with `[]`
- "Oh, errors get caught and shown to the user" → you know `try/catch`

When you see a pattern 5 times, it becomes automatic.

### Read Error Messages

Error messages tell you exactly what's wrong. Learn to read them before panicking. 90% of errors are:
- A typo (misspelled variable, missing comma)
- A missing import
- A type mismatch (passing a `string` where `number` expected)
- Something is `undefined` when you expected a value

### The Loop

Real development goes like this:
1. Make a small change
2. See if it works (or breaks)
3. Fix the error
4. Repeat

That's it. You never "write the whole thing perfectly." You iterate.

---

## The Big Picture — What Are We Building?

This is **Freshly Frontend**, a React Native mobile app built with Expo. It talks to a backend server (likely a "Freshly" API).

**The stack:**
```
React (UI library)
  → React Native (mobile UI framework)
    → Expo (toolchain / build system)
      → Expo Router (file-based navigation)
```

**What every file does at a glance:**

| File | What it does |
|---|---|
| `app/_layout.tsx` | Wraps the whole app (like the `<body>` tag + providers) |
| `app/index.tsx` | The home screen route (redirects to `src/screens/HomeScreen.tsx`) |
| `src/screens/HomeScreen.tsx` | The actual home screen code |
| `src/api/client.ts` | The thing that talks to the backend (Axios instance) |
| `src/api/tokenStorage.ts` | Saves login tokens securely |
| `src/api/types.ts` | Defines what API data looks like (TypeScript shapes) |
| `src/config/env.ts` | Reads settings like the API URL |
| `app.json` | Expo configuration (app name, icons, plugins) |
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript settings |
| `.prettierrc` | Code formatting rules |
| `eslint.config.js` | Linting rules |
| `.github/workflows/ci.yml` | Automatic checks on GitHub |

---

## Concept 1: TypeScript — The Safety Net

TypeScript is JavaScript **plus types**. It catches mistakes before you run the app.

### What you'll see constantly

```typescript
// 1. Defining what a thing looks like (interfaces)
interface User {
  id: number;
  name: string;
  email?: string;  // ? means optional
}

// 2. Using generics — a type that takes another type
useState<string>('checking');           // "this state is a string"
apiClient.get<string>('/some-endpoint'); // "expect a string response"
ApiResponse<User>;                       // "API response wrapping a User"

// 3. Type annotations
const [status, setStatus] = useState<string>('checking');
//                ^^^^^^  tells TS: status is a string

// 4. Optional chaining — safely access something that might not exist
error.response?.data?.message;
// If error.response is undefined, stop here. Don't crash.

// 5. Nullish coalescing — fallback if value is null/undefined
const name = user.name ?? 'Guest';
// Use 'Guest' if user.name is null or undefined
```

### Why you should care

Without TypeScript: `Cannot read property 'name' of undefined` (runtime crash).
With TypeScript: `Object is possibly 'undefined'` (caught at dev time).

### The 3 types you'll use most

```typescript
interface ApiResponse<T> {
  data: T;           // T changes depending on what you're fetching
  message?: string;
}

interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
```

These are defined in `src/api/types.ts` and used everywhere.

### What `strict: true` means

In `tsconfig.json`:
```json
{ "strict": true }
```

This turns on **all** safety checks. It's annoying at first but catches tons of bugs. The main things it does:
- No implicit `any` (you must declare types explicitly)
- Strict null checks (can't pass `null` to something expecting a `string`)
- Other safety stuff

### Path Alias `@/`

```json
// tsconfig.json
"paths": {
  "@/*": ["./src/*"]
}
```

This lets you write:
```typescript
import { apiClient } from '@/api';    // good
// instead of
import { apiClient } from '../../../api';  // bad — fragile, ugly
```

The `@/` always means `src/`. Every import in this project uses it.

---

## Concept 2: React Components — The Building Blocks

A React Native screen is just a **function** that returns **JSX** (HTML-like code) describing what to show.

### The skeleton of every screen

```typescript
import { StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api';

export default function SomeScreen() {
  // 1. State goes here (useState)
  // 2. Side effects go here (useEffect)
  // 3. Event handlers go here (functions)

  return (
    <View style={styles.container}>
      {/* 4. UI goes here */}
    </View>
  );
}

// 5. Styles go at the bottom
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // ...more style properties
  },
});
```

This is the **standard pattern** for every screen. Memorize this layout.

### Default export

```typescript
export default function HomeScreen() { ... }
```

`export default` means "this is the main thing this file provides." Expo Router looks for the default export when loading a route.

### JSX — HTML for React Native

```typescript
<View style={styles.container}>
  <Text style={styles.title}>Hello</Text>
</View>
```

- `<View>` = a `<div>` in HTML (a box/container)
- `<Text>` = a `<span>` or `<p>` in HTML (must use `Text` for any text)
- Style comes from the `styles` object below
- Every tag must close (`<View />` or `<View></View>`)

**Key rule:** You can't put text directly inside `View`. Text must be inside `<Text>`.

---

## Concept 3: State & Effects — Making Things Happen

### `useState` — Remembering things

```typescript
const [status, setStatus] = useState<string>('checking');
```

This does three things:
1. Creates a variable `status` with initial value `'checking'`
2. Creates a function `setStatus` that updates it
3. When `setStatus` is called, React re-renders the component (updates the UI)

**The flow:**
```
You call setStatus('Connected: hello')
  → React re-runs the component
  → status is now 'Connected: hello'
  → The UI shows the new value
```

**Never do this:**
```typescript
status = 'new value';  // WRONG — React won't know it changed
```
**Always do this:**
```typescript
setStatus('new value'); // RIGHT — React sees the change
```

### `useEffect` — Doing things at the right time

```typescript
useEffect(() => {
  // This runs when the component appears on screen
  const doSomething = async () => {
    const result = await fetchSomething();
    setSomething(result);
  };
  doSomething();
}, []);  // Empty array = "run once when component mounts"
```

Pattern breakdown:
- `useEffect` takes a function and a dependency array `[]`
- `[]` = "run this once when the screen first shows up"
- You **cannot** make the function itself `async`, so you define an inner `async` function and call it immediately
- Inside, you typically do API calls, then update state with the result

### The most common useEffect pattern (API call on mount)

```typescript
useEffect(() => {
  const loadData = async () => {
    try {
      const response = await apiClient.get('/some-endpoint');
      setData(response.data);
    } catch (error) {
      setError(error.message);
    }
  };
  loadData();
}, []);
```

This is the **single most common pattern** in mobile apps. Learn it by heart.

---

## Concept 4: React Native Layout — Putting Stuff on Screen

### StyleSheet.create

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
});
```

- `StyleSheet.create()` validates your styles and makes them faster
- Property names are **camelCase** (not CSS's kebab-case): `backgroundColor` not `background-color`
- Values are **unitless numbers** for sizes: `fontSize: 24` not `fontSize: '24px'`
- Strings for colors, font names, etc.

### Flexbox — How everything gets positioned

React Native uses Flexbox by default. Three properties do 90% of the work:

```typescript
container: {
  flex: 1,           // "fill all available space" (1 = take 1 share)
  justifyContent: 'center',  // vertical centering (in a column layout)
  alignItems: 'center',      // horizontal centering
}
```

- `flex: 1` = take up all available space
- `flex: 2` = take up twice as much space as `flex: 1`
- `justifyContent` = main axis positioning (vertical by default in RN)
- `alignItems` = cross axis positioning (horizontal by default in RN)

### Common layouts

```typescript
// Full screen, centered
fullScreen: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
}

// Row of items
row: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
}

// Column with spacing
column: {
  gap: 16,  // space between children (RN 0.71+)
}
```

---

## Concept 5: Expo Router — Moving Between Screens

Expo Router uses **files as routes**, like a website.

### How it works

```
app/
  _layout.tsx    → wraps every screen (root layout)
  index.tsx      → the "/" route (home screen)
```

- `app/index.tsx` = the home screen
- `app/profile.tsx` = the "/profile" screen
- `app/settings/index.tsx` = the "/settings" screen
- `app/settings/notifications.tsx` = the "/settings/notifications" screen

### The root layout (`_layout.tsx`)

```typescript
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

Think of this as the **body tag** of your app. Everything renders inside it.
- `GestureHandlerRootView` = enables swipe gestures, pinch, etc.
- `SafeAreaProvider` = handles the notch / status bar / home indicator
- `<Stack />` = a stack navigator (screens push on top of each other)

### How a route file delegates to a screen

```typescript
// app/index.tsx — the route file
export { default } from '@/screens/HomeScreen';
```

Route files are kept minimal. The actual implementation lives in `src/screens/`.

### Navigating between screens

```typescript
import { router } from 'expo-router';

// Go to another screen
router.push('/profile');

// Go back
router.back();

// Replace current screen (can't go back)
router.replace('/login');
```

---

## Concept 6: Axios & API Calls — Talking to a Server

### What is Axios?

Axios is a library for making HTTP requests (GET, POST, PUT, DELETE) to your backend. It's like `fetch()` but with more features.

### The client setup (`src/api/client.ts`)

```typescript
const client = axios.create({
  baseURL: ENV.API_BASE_URL,  // all requests go to this URL
  timeout: 10_000,             // fail after 10 seconds
  headers: { 'Content-Type': 'application/json' },
});
```

Now all API calls look like:
```typescript
const response = await client.get('/users');    // GET http://api-url/users
const response = await client.post('/users', data); // POST with body
const response = await client.put('/users/1', data); // PUT
const response = await client.delete('/users/1');     // DELETE
```

### The actual pattern in the home screen

```typescript
const res = await apiClient.get<string>('/');
//                                      ↑ endpoint path
//                 ↑ generic: "I expect a string response"
setStatus(`Connected: ${res.data}`);
```

`<string>` tells TypeScript what type the response data is. If the API returns an object, you'd use `<User>` or `<ApiResponse<User>>`.

### Async/await — Waiting for stuff

```typescript
const result = await someAsyncFunction();  // "wait here until done"
```

`await` pauses your code until the promise resolves. Without it:

```typescript
const result = someAsyncFunction();  // result is a Promise, not the actual value
```

You can only use `await` inside functions marked `async`:
```typescript
const doSomething = async () => {
  const result = await apiClient.get('/');
};
```

---

## Concept 7: Auth & Token Storage — Login Stuff

### Why tokens?

When a user logs in, the server gives them:
- **Access token** (short-lived, ~15 min) — proves who you are
- **Refresh token** (long-lived, ~7 days) — gets you a new access token

You store both securely and send the access token with every request.

### Secure storage (`src/api/tokenStorage.ts`)

```typescript
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'freshly_access_token';
const REFRESH_KEY = 'freshly_refresh_token';

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },
  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_KEY, token);
  },
  async clearTokens(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  },
};
```

- `SecureStore` is encrypted (uses Keychain on iOS, EncryptedSharedPreferences on Android)
- Never use regular AsyncStorage for tokens (not encrypted)
- `Promise.all([...])` runs both deletions in parallel (faster than one after the other)

### How tokens get attached automatically (interceptors)

**Request interceptor** — runs before every API call:
```typescript
client.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

Every request gets `Authorization: Bearer <your-token>` automatically. You never write this yourself.

### How token refresh works (the magic part)

**Response interceptor** — runs after every API response:

```typescript
client.interceptors.response.use(
  (response) => response,  // success: do nothing
  async (error) => {       // failure: check if 401
    if (status === 401 && !isRefreshRequest) {
      // 1. Try to refresh the token
      // 2. If successful, retry the original request
      // 3. If failed, clear tokens and reject
    }
    // Normalize the error
    return Promise.reject(normalizedError);
  },
);
```

The user **never knows** this happened. If the access token expired, the app silently gets a new one and retries the request. The user's action just succeeds.

---

## Concept 8: Error Handling — When Things Break

### The error normalization pattern

Backend errors come in all shapes. This project normalizes them into one consistent shape:

```typescript
interface ApiError {
  message: string;     // human-readable error message
  statusCode: number;  // 400, 401, 403, 404, 500, etc.
  error?: string;      // optional technical error code
}
```

In the response interceptor:
```typescript
const normalised: ApiError = {
  message: error.response?.data?.message ?? error.message ?? 'Unknown error',
  //                                ↑ API said   ↑ Axios said    ↑ ultimate fallback
  statusCode: status ?? 0,
  error: error.response?.data?.error,
};
```

The `??` operator means: use the first value that isn't `null` or `undefined`.

### How screens handle errors

```typescript
try {
  const res = await apiClient.get('/');
  setStatus(`Connected: ${res.data}`);
} catch (err: any) {
  setStatus(`Failed: ${err.message}`);  // show error to user
}
```

### What `Promise.reject` means

```typescript
return Promise.reject(normalised);
```

This says "this promise failed with this error." It's like `throw normalised` but for promise chains. The `catch` in your screen's `try/catch` will receive this object.

---

## Concept 9: Project Structure — Where to Put Files

```
freshly-frontend/
  app/                     # Expo Router routes (file-based routing)
    _layout.tsx            #   Root layout (wraps every screen)
    index.tsx              #   Home route — delegates to src/screens/
  src/
    api/                   # API layer
      client.ts            #   Axios instance with interceptors
      tokenStorage.ts      #   Secure token read/write
      types.ts             #   API type definitions
      index.ts             #   Barrel file (re-exports everything)
    config/
      env.ts               #   Environment configuration
    screens/               # Screen components
      HomeScreen.tsx       #   The home screen
    global.css             #   Web-only CSS (ignored on mobile)
  assets/                  # Images, icons, splash screen
  app.json                 # Expo config
  package.json             # Dependencies
  tsconfig.json            # TypeScript config
  .prettierrc              # Code format rules
  eslint.config.js         # Linting rules
```

### The pattern for adding new things

```
New screen → src/screens/NewScreen.tsx + app/new-screen.tsx
New API call → src/api/something.ts (or add to client.ts)
New config → src/config/something.ts
```

### Barrel files (index.ts)

```typescript
// src/api/index.ts
export { default as apiClient } from './client';
export * from './types';
export { tokenStorage } from './tokenStorage';
```

This lets consumers import everything from one place:
```typescript
import { apiClient, tokenStorage, ApiResponse } from '@/api';
// Not: import { apiClient } from '@/api/client';
// Not: import { tokenStorage } from '@/api/tokenStorage';
```

---

## Concept 10: Config & Environment — Settings That Change

### How the API URL is determined (`src/config/env.ts`)

```typescript
function getApiBaseUrl(): string {
  // 1. Check for EXPO_PUBLIC_API_URL from .env file
  if (extra.apiBaseUrl) return extra.apiBaseUrl;

  // 2. On a real device, derive from Expo's dev server host
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000`;
  }

  // 3. Fallback for emulator
  return 'http://localhost:3000';
}
```

**Why this matters:**
- On an emulator, `localhost:3000` works
- On a physical device, `localhost` is the phone itself, not your computer. The code detects your computer's IP from Expo's dev server and uses that
- In production, you set `EXPO_PUBLIC_API_URL` in `.env.production`

### How to set environment variables

Create a `.env` file:
```
EXPO_PUBLIC_API_URL=http://192.168.1.42:3000
```

Expo automatically makes `EXPO_PUBLIC_*` variables available via `Constants.expoConfig?.extra`.

---

## Concept 11: Code Quality Tools — Linters & Formatters

### Prettier — Automatic formatting

```json
// .prettierrc
{
  "semi": true,            // always add semicolons
  "singleQuote": true,     // 'single' not "double" quotes
  "trailingComma": "all",  // add trailing comma everywhere
  "printWidth": 100,       // wrap lines at 100 chars
  "tabWidth": 2            // 2-space indentation
}
```

Run: `npm run format` — reformats all your code.

**Just let it do its job.** Don't fight the formatter. It removes all arguments about code style.

### ESLint — Code quality rules

```typescript
// eslint.config.js
const expoConfig = require('eslint-config-expo/flat');
```

This applies rules specific to Expo/React Native. It catches things like:
- Unused variables
- Missing dependencies in `useEffect`
- Bad practices in React components

Run: `npm run lint`

### TypeScript check

Run: `npx tsc --noEmit`

This checks for type errors without creating output files. Do this before pushing.

### VS Code setup (recommended)

Add to `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

Now every time you save a file, Prettier formats it automatically.

---

## Concept 12: CI/CD — Automatic Checks

Every time you push to GitHub, a workflow runs automatically (`.github/workflows/ci.yml`):

```yaml
jobs:
  lint:
    steps:
      - run: npx tsc --noEmit        # TypeScript check
      - run: npm run lint              # ESLint
      - run: npx prettier --check ... # Format check
```

This means:
1. You push code
2. GitHub checks it for type errors, lint errors, and formatting issues
3. If anything fails, you fix it and push again

**The CI must pass before merging.** This prevents broken code from ever reaching the main branch.

---

## How to Add a New Screen — Step by Step

Let's say you want to add a "Profile" screen.

### Step 1: Create the screen component

`src/screens/ProfileScreen.tsx`:
```typescript
import { StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
});
```

### Step 2: Add the route

`app/profile.tsx`:
```typescript
export { default } from '@/screens/ProfileScreen';
```

That's it. The screen is now available at `/profile`.

### Step 3: Navigate to it

```typescript
import { router } from 'expo-router';

// In some button press handler:
router.push('/profile');
```

### Pattern for an API-backed screen

```typescript
import { StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api';

interface User {
  id: number;
  name: string;
  email: string;
}

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiClient.get<User>('/profile');
        setUser(res.data);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchUser();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{user.name}</Text>
      <Text>{user.email}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
});
```

This shows:
- Loading state (`if (!user)`)
- Error state (`if (error)`)
- Success state (the user data)
- TypeScript interface for the data
- Standard `useEffect` + `useState` pattern
- API call with generic `<User>`

This **loading/error/success** pattern repeats on every screen that fetches data.

---

## Glossary — Words You'll Hear Every Day

| Term | Meaning |
|---|---|
| **Component** | A function that returns JSX (UI). Reusable piece of screen. |
| **JSX** | HTML-like syntax inside JavaScript. Describes what to render. |
| **Props** | Data passed into a component: `<UserCard name="John" />` |
| **State** | Data that changes over time. Managed with `useState`. |
| **Hook** | A function starting with `use` that adds features to components (`useState`, `useEffect`). |
| **Effect** | Code that runs at specific times (mount, update, unmount). `useEffect`. |
| **Promise** | A placeholder for a future value. `async/await` makes working with them easier. |
| **Resolve/Reject** | A promise either resolves (succeeds) or rejects (fails). |
| **Interceptors** | Middleware for API calls. Runs before/after every request. |
| **JWT** | JSON Web Token — a token that proves you're authenticated. |
| **Bearer token** | `Authorization: Bearer <token>` — the standard way to send JWT. |
| **401 Unauthorized** | HTTP status meaning "you're not logged in" or "your token expired." |
| **Flexbox** | The layout system React Native uses to position elements. |
| **Barrel file** | An `index.ts` that re-exports other files in the same folder. |
| **CI/CD** | Continuous Integration / Continuous Deployment — automatic checks and deployments. |
| **Lint** | Automated code review for potential errors and bad practices. |
| **TypeScript generic** | A type that works with multiple types: `Array<string>`, `ApiResponse<User>`. |
| **Optional chaining** | `?.` — safely access properties without crashing if intermediate is null/undefined. |
| **Nullish coalescing** | `??` — use a default value only when the left side is null/undefined. |
| **Async/await** | Syntax for working with promises without callback hell. |
| **Expo Router** | File-based routing for Expo apps (files = routes). |
| **Secure Store** | Encrypted storage on device (Keychain on iOS). |

---

## Final Advice

1. **Start with one screen.** Don't try to understand the whole codebase at once. Focus on `HomeScreen.tsx` until you understand every line.

2. **Read the types first.** Before reading a function, look at the TypeScript types/interfaces it uses. They tell you what shape the data is.

3. **Use the pattern.** When you need to add a new feature, find the closest existing feature and copy its structure. Every screen follows the same pattern.

4. **The error is your friend.** When something breaks, read the error message. It tells you the file, line number, and what went wrong.

5. **Google effectively.** Search: `react native <what you want to do>` or `expo <problem>`. Add `site:stackoverflow.com` if you want human answers.

6. **You will break things.** That's normal. That's how you learn. Fix it and move on.

7. **The only way to learn is to build.** Watching tutorials gives you familiarity. Writing code gives you skill.
