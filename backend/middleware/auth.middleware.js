const { auth } = require('../firebase.js');

// Admin email from frontend admin login
const ADMIN_EMAIL = 'vibhors@techkriti.org';

const authenticateAdmin = async (req, res, next) => {
  try {
    // Get the Authorization header
    const authHeader = req.headers.authorization;
    
    console.log('Auth Header:', authHeader); // Debug log
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];
    console.log('Token extracted:', token.substring(0, 20) + '...'); // Debug log (truncated)

    // Verify the Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    console.log('Decoded token email:', decodedToken.email); // Debug log
    
    // Check if the user is an admin (has the admin email)
    if (decodedToken.email !== ADMIN_EMAIL) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: Admin privileges required' 
      });
    }

    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || null
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

const authenticateUser = async (req, res, next) => {
  try {
    // Get the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    // Verify the Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    
    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || null
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

module.exports = { authenticateAdmin, authenticateUser };