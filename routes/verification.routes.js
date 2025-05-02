// routes/verification.routes.js
const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verification.controller');
const { protect } = require('../middleware/auth.middleware');

// Rota protegida para verificar a identidade
router.post('/verify-identity', protect, verificationController.verifyIdentity);

// Rota GET para instruir sobre o uso (opcional)
router.get('/verify-identity', (req, res) => {
    res.send('Esta rota é para verificar a identidade. Use o método POST com um token JWT válido (via cookie ou header Authorization) e os campos "idDocument" e "selfie" no formato multipart/form-data.');
});

module.exports = router;