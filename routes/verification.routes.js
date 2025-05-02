const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verification.controller');
const { protect } = require('../middleware/auth.middleware'); // Se você quiser proteger essa rota

// REMOVE A PROTEÇÃO TEMPORARIAMENTE PARA TESTE LOCAL:
router.post('/verify-identity', verificationController.verifyIdentity);

// PARA REATIVAR A PROTEÇÃO APÓS O TESTE, DESCOMENTE A LINHA ABAIXO E COMENTE A LINHA ACIMA:
// router.post('/verify-identity', protect, verificationController.verifyIdentity);
router.get('/verify-identity', (req, res) => {
    res.send('Esta rota é para verificar a identidade (use POST para enviar os dados).');
  });
module.exports = router;