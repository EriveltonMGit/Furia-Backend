const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verification.controller');
const { protect } = require('../middleware/auth.middleware'); // Se você quiser proteger essa rota

router.post('/verify-identity', protect, verificationController.verifyIdentity); // Proteja a rota se necessário

module.exports = router;