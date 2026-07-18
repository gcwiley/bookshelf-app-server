import { Router } from 'express';
const router = Router();

// book controller functions
import {
  newBook,
  getBooks,
  getBookById,
  updateBookById,
  deleteBookById,
  getBookCount,
  getRecentlyCreatedBooks,
  searchBooks,
  getFavoriteBooks,
} from '../controllers/book.controller.js';

// GET /api/books/count - count all books
router.get('/count', getBookCount);

// GET /api/books/recent - get recent books
router.get('/recent', getRecentlyCreatedBooks);

// GET /api/books/search - search books
router.get('/search', searchBooks);

// GET /api/books/favorites - get favorite books
router.get('/favorites', getFavoriteBooks);

// GET /api/books - get all books
router.get('/', getBooks);

// GET /api/books/:id - get book by ID
// (must come after specific routes like 'count', 'recent', or 'favorites')
router.get('/:id', getBookById);

// POST /api/books - create new book
router.post('/', newBook);

// PATCH /api/books/:id - update book
router.patch('/:id', updateBookById);

// DELETE /api/books/:id - delete book
router.delete('/:id', deleteBookById);

export { router as bookRouter };