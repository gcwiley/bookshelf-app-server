import mongoose from 'mongoose';
import validator from 'validator';
const { Schema } = mongoose;

// create the book schema
const bookSchema = new Schema(
  {
    // book title
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
      index: true,
    },
    // book author
    author: {
      type: Schema.Types.ObjectId,
      ref: 'Author',
      required: [true, 'Author is required.'],
      index: true,
    },
    // isbn
    isbn: {
      type: String,
      required: [true, 'ISBN is required.'],
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          return validator.isISBN(v);
        },
        message: (props) => `${props.value} is not a valid ISBN.`,
      },
    },
    // publication date
    publicationDate: {
      type: Date,
      required: [true, 'A date of publication is required.'],
      max: [new Date(), 'Publication date cannot be in the future.'],
    },
    // page count
    pageCount: {
      type: Number,
      required: [true, 'A page count is required.'],
      min: [1, 'Page count must be a positive number.'],
    },
    // genre
    genre: {
      type: String,
      required: [true, 'A genre is required.'],
      enum: [
        'Fiction',
        'Non-Fiction',
        'Science Fiction',
        'Fantasy',
        'Mystery',
        'Thriller',
        'Biography',
        'History',
        'Poetry',
        'Romance',
        'Other',
      ],
    },
    // favorite
    isFavorite: {
      type: Boolean,
      default: false,
    },
    // summary
    summary: {
      type: String,
      required: [true, 'A summary is required.'],
      trim: true,
      maxlength: [1000, 'Summary cannot exceed 1000 characters.'],
    },
    // book cover image URL
    coverImageUrl: {
      type: String,
      validate: {
        validator: function (v) {
          if (!v) return true; // optional
          return validator.isURL(v);
        },
        message: (props) => `${props.value} is not a valid URL.`,
      },
    },
    // book publisher
    publisher: {
      type: String,
      trim: true,
    },
    // language
    language: {
      type: String,
      trim: true,
      default: 'English',
    },
    // published format
    publishedFormat: {
      type: String,
      enum: ['Hardcover', 'Paperback', 'Ebook', 'Audiobook'],
    },
    // tags
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    // rating
    rating: {
      averageRating: {
        type: Number,
        min: [0, 'Rating cannot be negative.'],
        max: [5, 'Rating cannot exceed 5.'],
        default: 0,
      },
      ratingsCount: {
        type: Number,
        default: 0,
        min: [0, 'Ratings count cannot be negative.'],
      },
    },
  },
  {
    timestamps: true,
  }
);

// index the createdAt field for sorting
bookSchema.index({ createdAt: -1 });

const Book = mongoose.model('Book', bookSchema);

export { Book };