import admin from 'firebase-admin';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // case-insensitive check for 'Bearer <token>' pattern
  if (!authHeader || !/^bearer\s/i.test(authHeader)) {
    return res
      .status(401)
      .json({ message: 'Authorization header missing or malformed.' });
  }

  // extract the token
  const idToken = authHeader.split(' ')[1];

  if (!idToken) {
    return res.status(401).json({ message: 'Bearer token missing.' });
  }

  try {
    // verify the ID token (optionally check for revocation)
    // Pass `true` as the second argument if immediate token revocation checks are required
    const decodedToken = await admin.auth().verifyIdToken(idToken, false);
    req.user = decodedToken;
    next();
  } catch (error) {
    // graceful log levels depending on error type
    if (error.code === 'auth/id-token-expired') {
      console.warn('Authentication failed: Firebase ID token has expired.');
    } else if (error.code === 'auth/argument-error') {
      console.warn('Authentication failed: Firebase ID token is malformed.');
    } else {
      console.error('System Error verifying Firebase ID token:', error);
    }
    
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};
