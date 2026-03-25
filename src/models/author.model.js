import mongoose from 'mongoose';
const { Schema } = mongoose;

// create author schema
// description: Creates an author schema.
const authorSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Author name is required.'],
      trim: true,
      index: true,
      maxlength: [100, 'Name cannot exceed 100 characters.'],
    },
    biography: {
      type: String,
      trim: true,
      maxlength: [2000, 'Biography cannot exceed 2000 characters.'],
    },
  },
  {
    timestamps: true,
  }
);

// 

// index for sorting by creating date
authorSchema.index({ createdAt: -1 });

const Author = mongoose.model('Author', authorSchema);

export { Author };
