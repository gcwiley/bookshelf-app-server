import { Router } from 'express';
const router = Router();

// middleware
import { authenticate } from '../middleware/auth.middleware.js';

// user controller functions
import {
  signUp,
  getProfile,
  deleteUser,
} from '../controllers/user.controller.js';

// POST /api/users/signup
// public router: No token needed to create an account
router.post('/signup', signUp);

// GET /api/users/profile
// protected route: requires a valid Firebase ID token in the header
router.get('/profile', authenticate, getProfile);

// DELETE /api/users/:id
// protected route: requires authentication
router.delete('/:id', authenticate, deleteUser);

export { router as userRouter };
