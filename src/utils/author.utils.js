import mongoose from 'mongoose';
import { Author } from '../models/author.model.js';

/**
 * Escapes special regex characters in a string.
 * @param {string} string - String to escape
 * @returns {string} Escaped string safe for RegExp
 */
export const escapeRegex = (string) => {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

/**
 * Resolves an author string, object, or ObjectId to a valid Author document _id.
 * If the author name does not exist, a new Author document is created.
 * @param {string|object|mongoose.Types.ObjectId} author - Author input
 * @returns {Promise<mongoose.Types.ObjectId|undefined>} Resolved Author _id
 */
export const resolveAuthor = async (author) => {
  if (!author) return undefined;

  // If author is an object, try to extract the name or ID
  let authorValue = author;
  if (typeof author === 'object') {
    if (author._id) {
      authorValue = author._id;
    } else if (author.id) {
      authorValue = author.id;
    } else if (author.name) {
      authorValue = author.name;
    }
  }

  if (typeof authorValue === 'string') {
    const trimmed = authorValue.trim();
    if (!trimmed) return undefined;

    // Check if it's a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(trimmed)) {
      const authorDoc = await Author.findById(trimmed);
      if (authorDoc) {
        return authorDoc._id;
      }
    }

    // Try finding by name (case-insensitive)
    let authorDoc = await Author.findOne({
      name: { $regex: new RegExp('^' + escapeRegex(trimmed) + '$', 'i') },
    });

    if (!authorDoc) {
      authorDoc = new Author({ name: trimmed });
      await authorDoc.save();
    }
    return authorDoc._id;
  }

  // If it's already an ObjectId instance
  if (authorValue instanceof mongoose.Types.ObjectId) {
    return authorValue;
  }

  return undefined;
};
