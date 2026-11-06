# You are an expert in Node.js, Express, MongoDB (Mongoose), Firebase Admin, and Google Cloud Run development. You write secure, maintainable, performant, and idiomatic JavaScript (ES Modules) following modern backend best practices.

## Project Overview

`bookshelf-server` is the Node.js / Express REST API backend for the Bookshelf application. It connects to MongoDB via Mongoose, uses Firebase Admin SDK for authentication and Cloud Storage, loads production secrets from Google Cloud Secret Manager, and serves the compiled Angular SPA (`src/dist/bookshelf-client/browser`).

## Commands

- **Development (with `.env` and file watcher)**: `npm run dev` (`node --env-file=.env --watch src/server.js`)
- **Production start**: `npm start` (`node src/server.js`)
- **Run unit tests**: `npm test` (`vitest run`)
- **Deploy to Google Cloud Run**: `npm run deploy` (`gcloud builds submit --region=us-east4 --config=cloudbuild.yaml`)

## Architecture & Startup Order

- **`src/server.js` (Entry Point)**: Must always run `await loadSecrets()` **before** dynamically importing `./app.js` (`await import('./app.js')`) so environment variables from Google Secret Manager are populated in `process.env` before `app.js` initializes CORS, Firebase, and database connections.
- **`src/secrets.js` & `config.json`**: Fetches `MONGO_CONNECTION_STRING`, `MONGO_DATABASE_PASSWORD`, and `CORS_ORIGIN` concurrently from Google Cloud Secret Manager when running in production (`NODE_ENV === 'production'`, `K_SERVICE`, or `GAE_ENV`). Reads non-sensitive project defaults (`SECRETS_PROJECT_ID` and `DATABASE_NAME`) from `config.json` (with fallback to `process.env` and `client.getProjectId()`).
- **`src/app.js`**: Configures Express, Firebase Admin (using `applicationDefault()` in production/Cloud Run and `credentials/service-account.json` locally), CORS, rate limiting (`/api`), static file serving, API routes (`/api/books`, `/api/users`), SPA catch-all (`*`), and graceful shutdown (`SIGINT` / `SIGTERM`).
- **`src/db/connect_to_db.js`**: Manages the Mongoose connection (`strictQuery: true`, `autoIndex` disabled in production).

## JavaScript & Node.js Best Practices

- **ES Modules Only**: Use `import` / `export` syntax (`"type": "module"` in `package.json`). Always include the `.js` file extension in relative imports (e.g., `import { Book } from '../models/book.model.js'`).
- **Async / Await**: Use `async`/`await` with `try`/`catch` blocks in controllers and middleware; never leave unhandled promise rejections.
- **Native Node Features**: Prefer built-in Node.js features (such as `--env-file=.env` and `--watch` in Node 24) over unnecessary external packages.

## Express & API Conventions

- **Response Shape**: Return consistent JSON payloads from controllers:
  - Success: `{ success: true, message?: string, data?: any }`
  - Error: `{ success: false, message: string, error?: string }`
- **Route Ordering**: In `src/routes/book.routes.js`, static sub-routes (`/count`, `/recent`, `/search`, `/favorites`) **must** be registered before parameterized routes (`/:id`).
- **API 404 before SPA Catch-All**: Keep the `/api` 404 handler registered before the `*` SPA `index.html` catch-all in `src/app.js`.
- **Rate Limiting**: All `/api` routes are protected by `express-rate-limit` (`trust proxy` enabled in production/Cloud Run).

## Database & Mongoose Best Practices

- **ObjectId Validation**: Always validate `req.params.id` with `mongoose.Types.ObjectId.isValid(id)` before querying (`findById`, `findByIdAndUpdate`, `findByIdAndDelete`) and return `400` if invalid.
- **Author Resolution**: Book documents store `author` as an `ObjectId` referencing the `Author` model. Always resolve incoming author strings, objects, or IDs via `resolveAuthor()` (`src/utils/author.utils.js`) when creating or updating books, and `.populate('author')` when reading books.
- **Regex Safety**: Always sanitize user input with `escapeRegex()` (`src/utils/author.utils.js`) before constructing `$regex` queries.
- **Schema Validation**: Keep validation rules inside Mongoose schemas (`src/models/*.model.js`) using `validator` (e.g., `isISBN`, `isURL`) and pass `{ new: true, runValidators: true }` on updates.

## Authentication & Security

- **Firebase Auth**: Protected routes must use `authenticateToken` (`src/middleware/auth.middleware.js`), which verifies the `Bearer <idToken>` header via `admin.auth().verifyIdToken()` and attaches the decoded token to `req.user`.
- **No Passwords in MongoDB**: Never store user passwords in MongoDB. Firebase Authentication manages credentials; MongoDB `User` documents link via `firebaseUid`.
- **File Uploads**: Use `upload` (`src/middleware/upload.middleware.js`) with `multer.memoryStorage()`, image MIME-type filtering, and size limits (`MAX_FILE_SIZE`, default 5MB) before streaming to Firebase Cloud Storage (`res.locals.bucket`).
- **Secrets & Credentials**: Never commit `.env` or `credentials/service-account.json` to Git or upload them to Cloud Build (keep both excluded in `.gitignore` and `.gcloudignore`).

## Testing (Vitest)

- Unit tests live in `src/tests/*.test.js` and run with Vitest (`npx vitest run`).
- Mock external services (`@google-cloud/secret-manager`, Mongoose models, Firebase Admin) using `vi.mock()` and `vi.spyOn()` so tests run fast and isolated without network or database connections.
- When mocking constructor classes with `vi.fn().mockImplementation()`, always use a regular `function () {}` (not an arrow function) so `new` instantiation works in Vitest v4.
