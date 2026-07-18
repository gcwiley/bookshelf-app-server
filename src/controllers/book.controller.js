import mongoose from 'mongoose';
import { Book } from '../models/book.model.js';
import { Author } from '../models/author.model.js';

const escapeRegex = (string) => {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

const resolveAuthor = async (author) => {
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

// NEW BOOK
export const newBook = async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      publicationDate,
      pageCount,
      genre,
      isFavorite,
      summary,
      coverImageUrl,
      publisher,
      language,
      publishedFormat,
      tags,
      rating,
    } = req.body;

    // Resolve author name or ID to an Author model _id
    const resolvedAuthorId = await resolveAuthor(author);

    const book = new Book({
      title,
      author: resolvedAuthorId,
      isbn,
      publicationDate,
      pageCount,
      genre,
      isFavorite: isFavorite || false,
      summary,
      coverImageUrl,
      publisher,
      language,
      publishedFormat,
      tags,
      rating,
    });
    // saves new book to the database
    await book.save();
    res
      .status(201)
      .json({ success: true, message: 'Successfully added book to database.' });
  } catch (error) {
    console.error('Error creating book.', error);
    res.status(500).json({
      success: false,
      message: 'Error creating book.',
      error: error.message,
    });
  }
};

// GET ALL BOOKS (PAGINATION)
export const getBooks = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const books = await Book.find({}).populate('author').skip(skip).limit(limit);
    const totalBooks = await Book.countDocuments();

    res.status(200).json({
      success: true,
      message: 'Paginated books fetched successfully.',
      data: books,
      totalPages: Math.ceil(totalBooks / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching paginated books:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching paginated books.',
      error: error.message,
    });
  }
};

// GET BOOK BY ID
export const getBookById = async (req, res) => {
  // find id of book from params.
  const _id = req.params.id;

  try {
    // filter by _id
    const book = await Book.findById(_id).populate('author');

    // if no book by ID is found
    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: 'No book with that ID was found.' });
    }

    // send book back to client
    res.status(200).json({
      success: true,
      message: 'Book retrieved successfully.',
      data: book,
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching book.',
      error: error.message,
    });
  }
};

// UPDATE BOOK BY ID
export const updateBookById = async (req, res) => {
  // get the id from params
  const _id = req.params.id;
  try {
    const updateData = { ...req.body };
    if (updateData.author !== undefined) {
      updateData.author = await resolveAuthor(updateData.author);
    }

    const book = await Book.findByIdAndUpdate(_id, updateData, {
      new: true,
      runValidators: true,
    });

    // if no book is found - send 404 error msg
    if (!book) {
      return res.status(404).json({ success: false, message: 'No book with that ID was found.' });
    }

    // send updated book back to client
    res.status(200).json({
      success: true,
      message: 'Book updated successfully.',
      data: book,
    });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating book.',
      error: error.message,
    });
  }
};

// DELETE BOOK BY ID
export const deleteBookById = async (req, res) => {
  try {
    // finds and deletes a book that takes id into account
    const book = await Book.findByIdAndDelete({
      _id: req.params.id,
    });

    // if no book is found
    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: 'No book with that ID was found.' });
    }
    res
      .status(200)
      .json({ success: true, message: 'Book deleted successfully.' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting book.',
      error: error.message,
    });
  }
};

// GET BOOK COUNT
export const getBookCount = async (req, res) => {
  try {
    const bookCount = await Book.countDocuments({});

    // send book count to client
    res
      .status(200)
      .json({ success: true, message: 'Book count', data: bookCount });
  } catch (error) {
    console.error('Error fetching book count.', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching book count.',
      error: error.message,
    });
  }
};

// GET 5 RECENT BOOKS
export const getRecentlyCreatedBooks = async (req, res) => {
  try {
    const mostRecentBooks = await Book.find({})
      .sort({ createdAt: -1 })
      .limit(5);

    // no recent books found
    if (!mostRecentBooks || mostRecentBooks.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'No recent books found.' });
    }
    res.status(200).json({
      success: true,
      message: 'Successfully fetched most recently created books.',
      data: mostRecentBooks,
    });
  } catch (error) {
    console.error('Error fetching recent books:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent books.',
      error: error.message,
    });
  }
};

// SEARCH ALL BOOKS
export const searchBooks = async (req, res) => {
  const searchQuery = req.query.q;

  try {
    const books = await Book.find({
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { summary: { $regex: searchQuery, $options: 'i' } },
      ],
    });

    if (!books.length) {
      return res
        .status(404)
        .json({ success: false, message: 'No books matched your search.' });
    }

    res.status(200).json({ success: true, data: books });
  } catch (error) {
    console.error('Error searching books:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching books.',
      error: error.message,
    });
  }
};

// GET FAVORITE BOOKS
export const getFavoriteBooks = async (req, res) => {
  try {
    const favoriteBooks = await Book.find({ isFavorite: true }).populate('author');
    res.status(200).json({
      success: true,
      message: 'Successfully fetched favorite books.',
      data: favoriteBooks,
    });
  } catch (error) {
    console.error('Error fetching favorite books:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching favorite books.',
      error: error.message,
    });
  }
};

// UPLOAD BOOK COVER
export const uploadBookCover = async (req, res) => {
  const { id } = req.params; // book id from URL parameters

  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: 'No file uploaded' });
  }

  try {
    const book = await Book.findById(id);
    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: 'Book not found.' });
    }

    const file = req.file;
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `covers/${book._id}-${Date.now()}.${fileExtension}`;

    const fileUpload = res.locals.bucket.file(fileName);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on('error', (error) => {
      console.error('Error uploading to Firebase Storage:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image.',
        error: error.message,
      });
    });

    blobStream.on('finish', async () => {
      // make the file public
      await fileUpload.makePublic();
      const publicUrl = fileUpload.publicUrl();

      // update book with cover image URL
      book.coverImageUrl = publicUrl;
      await book.save();

      res.status(200).json({
        success: true,
        message: 'Book cover uploaded and updated successfully.',
        data: {
          bookId: book._id,
          coverImageUrl: publicUrl,
        },
      });
    });

    blobStream.end(file.buffer);
  } catch (error) {
    console.error('Error in uploadBookCover:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during image upload.',
      error: error.message,
    });
  }
};
