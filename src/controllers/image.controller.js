import path from 'path';
import Image from '../models/image.model.js';

const UPLOAD_DIR = 'uploads';

// GET ALL IMAGES
export const getImages = async (req, res) => {
  try {
    // Fetch images from the database for the logged-in user
    const images = await Image.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: 'Images retrieved successfully.',
      data: images,
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching images.',
      error: error.message,
    });
  }
};

// GET IMAGE BY ID
export const getImageById = async (req, res) => {
  const { id } = req.params;

  try {
    // Find image by DB ID and ensure it belongs to the user
    const image = await Image.findOne({ _id: id, user: req.user.id });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Image retrieved successfully.',
      data: image,
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching image.',
      error: error.message,
    });
  }
};

// GET 5 MOST RECENT IMAGES
export const getRecentImages = async (req, res) => {
  try {
    const recentImages = await Image.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      message: 'Recent images retrieved.',
      data: recentImages,
    });
  } catch (error) {
    console.error('Error fetching recent images:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent images.',
      error: error.message,
    });
  }
};

// UPLOAD IMAGE
export const uploadImage = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: 'No file uploaded' });
  }

  try {
    const file = req.file;
    const fileExtension = path.extname(file.originalname);
    const fileName = `${UPLOAD_DIR}/${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${fileExtension}`;

    const fileUpload = req.bucket.file(fileName);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on('error', (error) => {
      console.error('Error uploading to Cloud Storage:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image.',
        error: error.message,
      });
    });

    blobStream.on('finish', async () => {
      try {
        await fileUpload.makePublic();
        const publicUrl = fileUpload.publicUrl();

        // Parse tags if provided (assuming comma-separated string)
        let tags = [];
        if (req.body.tags) {
          tags = Array.isArray(req.body.tags)
            ? req.body.tags
            : req.body.tags.split(',').map((tag) => tag.trim());
        }

        // Create new Image document
        const newImage = new Image({
          user: req.user.id,
          imageUrl: publicUrl,
          fileName: fileName,
          title: req.body.title,
          description: req.body.description,
          tags: tags,
          contentType: file.mimetype,
          size: file.size,
        });

        await newImage.save();

        res.status(201).json({
          success: true,
          message: 'Image uploaded and saved successfully.',
          data: newImage,
        });
      } catch (error) {
        console.error('Error saving image to database:', error);
        // Attempt to delete the file from bucket if DB save fails to maintain consistency
        try {
          await fileUpload.delete();
        } catch (delError) {
          console.error('Failed to cleanup file after DB error:', delError);
        }

        res.status(500).json({
          success: false,
          message: 'Error saving image data.',
          error: error.message,
        });
      }
    });

    blobStream.end(file.buffer);
  } catch (error) {
    console.error('Error in uploadImage:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during image upload.',
      error: error.message,
    });
  }
};

// DELETE IMAGE BY ID
export const deleteImageById = async (req, res) => {
  const { id } = req.params; // Using ID instead of fileName for DB lookup

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: 'Image ID is required.' });
  }

  try {
    // Find the image in DB first
    const image = await Image.findOne({ _id: id, user: req.user.id });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found or access denied.',
      });
    }

    // Delete from Bucket
    const file = req.bucket.file(image.fileName);
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
    } else {
      console.warn(`File ${image.fileName} not found in bucket, removing from DB anyway.`);
    }

    // Delete from DB
    await Image.deleteOne({ _id: id });

    res
      .status(200)
      .json({ success: true, message: 'Image deleted successfully.' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image.',
      error: error.message,
    });
  }
};

// COUNT IMAGES
export const countImages = async (req, res) => {
  try {
    const count = await Image.countDocuments({ user: req.user.id });
    res.status(200).json({
      success: true,
      message: 'Image count retrieved.',
      data: { count },
    });
  } catch (error) {
    console.error('Error counting images:', error);
    res.status(500).json({
      success: false,
      message: 'Error counting images.',
      error: error.message,
    });
  }
};
