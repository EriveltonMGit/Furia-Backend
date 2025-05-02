// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Rotas de autenticação
router.post('/register', (req, res, next) => {
    console.log('Requisição de registro recebida');
    next();
}, authController.register);

router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);
router.post('/logout', authController.logout);

router.post('/google', authController.googleLogin);

module.exports = router;