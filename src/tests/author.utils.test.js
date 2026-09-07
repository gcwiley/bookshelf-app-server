import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { escapeRegex, resolveAuthor } from '../utils/author.utils.js';
import { Author } from '../models/author.model.js';

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

describe('author.utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('escapeRegex', () => {
    it('escapes special regex characters correctly', () => {
      const input = 'hello [world] (test) {1,2} * + ? ^ $ . | / \\';
      const escaped = escapeRegex(input);
      expect(escaped).toBe(
        'hello \\[world\\] \\(test\\) \\{1,2\\} \\* \\+ \\? \\^ \\$ \\. \\| \\/ \\\\'
      );
    });
  });

  describe('resolveAuthor', () => {
    it('returns undefined if author is falsy', async () => {
      expect(await resolveAuthor(null)).toBeUndefined();
      expect(await resolveAuthor(undefined)).toBeUndefined();
      expect(await resolveAuthor('')).toBeUndefined();
    });

    it('returns the ObjectId directly if passed an ObjectId instance', async () => {
      const objectId = new mongoose.Types.ObjectId();
      const result = await resolveAuthor(objectId);
      expect(result).toBe(objectId);
    });

    it('finds existing author by ObjectId string', async () => {
      const existingId = new mongoose.Types.ObjectId();
      Author.findById.mockResolvedValue({ _id: existingId, name: 'Tolkien' });

      const result = await resolveAuthor(existingId.toString());
      expect(Author.findById).toHaveBeenCalledWith(existingId.toString());
      expect(result).toBe(existingId);
    });

    it('finds existing author by name string', async () => {
      const existingId = new mongoose.Types.ObjectId();
      Author.findById.mockResolvedValue(null);
      Author.findOne.mockResolvedValue({ _id: existingId, name: 'J.K. Rowling' });

      const result = await resolveAuthor('J.K. Rowling');
      expect(Author.findOne).toHaveBeenCalledWith({
        name: { $regex: expect.any(RegExp) },
      });
      expect(result).toBe(existingId);
    });

    it('creates a new author if name not found', async () => {
      Author.findById.mockResolvedValue(null);
      Author.findOne.mockResolvedValue(null);

      const result = await resolveAuthor('New Author');
      expect(Author).toHaveBeenCalledWith({ name: 'New Author' });
      expect(result).toBeDefined();
    });

    it('handles author passed as an object with name or _id', async () => {
      const existingId = new mongoose.Types.ObjectId();
      Author.findById.mockResolvedValue({ _id: existingId, name: 'George Orwell' });

      const result = await resolveAuthor({ _id: existingId.toString() });
      expect(result).toBe(existingId);
    });
  });
});
