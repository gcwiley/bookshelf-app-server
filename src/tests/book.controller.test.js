import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { newBook, updateBookById } from '../controllers/book.controller.js';
import { Author } from '../models/author.model.js';
import { Book } from '../models/book.model.js';

vi.mock('../models/author.model.js', () => {
  const AuthorMock = vi.fn().mockImplementation(function (data) {
    this._id = new mongoose.Types.ObjectId();
    this.name = data?.name;
    this.save = vi.fn().mockResolvedValue(this);
  });
  AuthorMock.findById = vi.fn();
  AuthorMock.findOne = vi.fn();
  return { Author: AuthorMock };
});

vi.mock('../models/book.model.js', () => {
  const BookMock = vi.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this.save = vi.fn().mockResolvedValue(this);
  });
  BookMock.findByIdAndUpdate = vi.fn();
  return { Book: BookMock };
});

describe('Book Controller - Author Resolution', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      body: {
        title: 'The Great Gatsby',
        isbn: '9780743273565',
        publicationDate: new Date(),
        pageCount: 180,
        genre: 'Fiction',
        summary: 'A classic novel.',
      },
      params: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('newBook', () => {
    it('creates a new author if the author name is a string and does not exist', async () => {
      req.body.author = 'Scott Fitzgerald';
      Author.findOne.mockResolvedValue(null);

      await newBook(req, res);

      expect(Author.findOne).toHaveBeenCalledWith({
        name: { $regex: expect.any(RegExp) },
      });
      expect(Book).toHaveBeenCalledWith(
        expect.objectContaining({
          author: expect.any(mongoose.Types.ObjectId),
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('reuses existing author if finding by name succeeds', async () => {
      req.body.author = 'Scott Fitzgerald';
      const existingAuthorId = new mongoose.Types.ObjectId();
      Author.findOne.mockResolvedValue({ _id: existingAuthorId, name: 'Scott Fitzgerald' });

      await newBook(req, res);

      expect(Book).toHaveBeenCalledWith(
        expect.objectContaining({
          author: existingAuthorId,
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('reuses existing author if finding by valid ObjectId string succeeds', async () => {
      const authorId = new mongoose.Types.ObjectId();
      req.body.author = authorId.toString();
      Author.findById.mockResolvedValue({ _id: authorId, name: 'Scott Fitzgerald' });

      await newBook(req, res);

      expect(Author.findById).toHaveBeenCalledWith(authorId.toString());
      expect(Book).toHaveBeenCalledWith(
        expect.objectContaining({
          author: authorId,
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateBookById', () => {
    it('resolves author string to ID when updating a book', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      req.body = { author: 'Ernest Hemingway' };
      Author.findOne.mockResolvedValue(null);
      Book.findByIdAndUpdate.mockResolvedValue({ _id: req.params.id });

      await updateBookById(req, res);

      expect(Author.findOne).toHaveBeenCalledWith({
        name: { $regex: expect.any(RegExp) },
      });
      expect(Book.findByIdAndUpdate).toHaveBeenCalledWith(
        req.params.id,
        expect.objectContaining({
          author: expect.any(mongoose.Types.ObjectId),
        }),
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
