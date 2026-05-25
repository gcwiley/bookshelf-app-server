import admin from 'firebase-admin';
import { User } from '../models/user.model.js';

// SIGN UP NEW USER
export const signUp = async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    // Create user in Firebase Authentication
    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    // Create user in MongoDB
    const user = new User({
      firstName,
      lastName,
      email,
      firebaseUid: firebaseUser.uid, // Ensure your User model has this field
      // Do NOT save the password to MongoDB. Firebase handles that.
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        _id: user._id,
        firebaseUid: firebaseUser.uid,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);

    // If MongoDB fails, we should ideally cleanup the Firebase user
    // to prevent "ghost" accounts, but for now we just return the error.

    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return res
        .status(409)
        .json({ success: false, message: 'Email is already in use.' });
    }

    res.status(500).json({
      success: false,
      message: 'Error registering user.',
      error: error.message,
    });
  }
};

// GET USER PROFILE
export const getProfile = async (req, res) => {
  try {
    // req.user comes from your 'authenticate' middleware
    const { uid } = req.user;

    // Find the user in MongoDB using the Firebase UID
    const user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User profile not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'User profile retrieved.',
      data: user,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile.',
      error: error.message,
    });
  }
};

// DELETE USER
export const deleteUser = async (req, res) => {
  const { id } = req.params; // MongoDB ID passed in URL

  try {
    // 1. Find the user in MongoDB
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });
    }

    // 2. Delete from Firebase Auth
    if (user.firebaseUid) {
      try {
        await admin.auth().deleteUser(user.firebaseUid);
      } catch (fbError) {
        console.warn(
          'User not found in Firebase or already deleted:',
          fbError.message
        );
      }
    }

    // 3. Delete from MongoDB
    await User.findByIdAndDelete(id);

    res
      .status(200)
      .json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user.',
      error: error.message,
    });
  }
};
