import mongoose from 'mongoose';
const { Schema } = mongoose;

// create the user schema
const userSchema = new Schema(
  {
    // first name
    firstName: {
      type: String,
      required: [true, 'First name is required.'],
      trim: true,
    },
    // last name
    lastName: {
      type: String,
      required: [true, 'Last name is required.'],
      trim: true,
    },
    // email address
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true, // ensure no duplicate emails in MongoDB
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    // LINK TO FIREBASE: This is the critical new field
    firebaseUid: {
      type: String,
      required: [true, 'Firebase UID is required.'],
      unique: true,
      index: true, // indexing allows for fast lookups during login
    },
    // optional: store the profile image URL here
    profileImageUrl: {
      type: String,
      default: null,
    },
  },
  {
    // automatically adds `createdAt` and `updatedAt` fields
    timestamps: true,
  }
);

// create the user model
const User = mongoose.model('User', userSchema);

export { User };
