# Bookshelf Server

A robust, modern **Node.js / Express** REST API backend powering the Bookshelf library management application. It connects to **MongoDB** (via Mongoose), integrates with **Firebase Authentication** & **Firebase Storage**, and is structured to serve the compiled Angular frontend SPA.

---

## 🚀 Features

- **Book Collection Management**: Full CRUD endpoints for managing books, including paginated list, search, and count functionality.
- **Robust Model Validation**: Advanced schema validations including:
  - Strict ISBN-10/ISBN-13 checksum validation using the `validator` library.
  - Future-proofing checks to prevent publication dates in the future.
  - URL validations for book cover images.
- **User Authentication**: Secure routes guarded by Firebase Token Authentication middleware (`Bearer` token header verification).
- **File Uploads**: Integration with Firebase Cloud Storage for uploading book covers and profile images.
- **Production-Grade Security**:
  - API Rate Limiting to prevent brute-force attacks.
  - CORS configured for secure client-side domain access.
- **Secret Management**: Native integration with Google Cloud Secret Manager for running in production/Google App Engine, falling back to a local `.env` file in development.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express
- **Database**: MongoDB & Mongoose ODM
- **Auth & Storage**: Firebase Admin SDK
- **Security**: Express Rate Limit, CORS
- **Utilities**: Multer, Validator, Chalk, Dotenv

---

## 📁 Project Structure

```
bookshelf-server/
├── credentials/          # Local service-account credentials (git-ignored)
├── src/
│   ├── controllers/      # Route controllers (book.controller.js, user.controller.js)
│   ├── db/               # Database connection logic
│   ├── middleware/       # Express middlewares (auth, file uploads)
│   ├── models/           # Mongoose schemas (book, author, user)
│   ├── routes/           # Router entry points (book.routes.js, user.routes.js)
│   ├── tests/            # Test suites
│   ├── app.js            # Main Express application & server startup
│   └── secrets.js        # Google Secret Manager resolver
├── .env                  # Local environment configuration file (git-ignored)
├── package.json          # Project metadata and dependencies
└── README.md             # Project documentation
```

---

## ⚙️ Configuration & Environment Variables

Create a `.env` file in the root directory. The application supports the following variables:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | The port Express will listen on. | `3000` |
| `NODE_ENV` | Environment context. | `development` / `production` |
| `MONGO_CONNECTION_STRING` | Connection URI for the MongoDB cluster. | `mongodb+srv://...` |
| `DATABASE_NAME` | Name of the MongoDB database. | `bookshelf` |
| `CORS_ORIGIN` | Allowed client URL for CORS. | `http://localhost:4200` |
| `SECRETS_PROJECT_ID` | GCP Project ID for Secret Manager (production). | `my-gcp-project` |
| `MAX_FILE_SIZE` | Maximum file size for image uploads in bytes. | `5242880` (5MB) |

> [!NOTE]
> During local development, a Firebase service account JSON file must be placed at `credentials/service-account.json` to enable authentication and storage integrations.

---

## 🏃 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run in Development Mode (Hot Reloading)

```bash
npm run dev
```

### 3. Start in Production Mode

```bash
npm start
```

---

## 🔗 API Endpoints

### Books API (`/api/books`)

- `GET /api/books` - Retrieve books (paginated). Query params: `page`, `limit`.
- `GET /api/books/count` - Get total number of books in the collection.
- `GET /api/books/recent` - Get 5 most recently added books.
- `GET /api/books/search` - Search books by title or summary. Query param: `q`.
- `GET /api/books/:id` - Retrieve a specific book by MongoDB ID.
- `POST /api/books` - Create a new book.
- `PATCH /api/books/:id` - Update an existing book.
- `DELETE /api/books/:id` - Remove a book by ID.

### Users API (`/api/users`)

- `POST /api/users/signup` - Register a new user account (creates entry in Firebase Auth and MongoDB).
- `GET /api/users/profile` *(Protected)* - Get current authenticated user's profile.
- `DELETE /api/users/:id` *(Protected)* - Delete user from both Firebase Auth and MongoDB.
