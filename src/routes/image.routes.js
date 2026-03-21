import { Router } from 'express';
const router = Router();

// middleware
import { upload } from '../middleware/upload.middleware.js';

// image controller functions
import { getImages, getImageById, uploadImage, deleteImageById } from '../controllers/image.controller.js';

// GET /api/images
router.get('/', getImages);

// GET /api/images/:id
router.get('/:id', getImageById);

// POST /api/images/upload
router.post('/upload', upload.single('image'), uploadImage);

// DELETE /api/images/delete?fileName=uploads/filename.jpg
router.delete('/delete', deleteImageById);

export { router as imageRouter };
