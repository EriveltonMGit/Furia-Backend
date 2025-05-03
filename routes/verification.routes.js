const express = require("express");
const router = express.Router();
const verificationController = require("../controllers/verification.controller");

// Rota para verificar a identidade e salvar o resultado (sem proteção)
router.post("/verify-identity", verificationController.verifyIdentity);
router.post("/save-result", verificationController.saveVerificationResult);
router.post("/complete-verification", verificationController.completeVerification);

// NOVA ROTA PARA OBTER O STATUS DE VERIFICAÇÃO
router.get("/status/:userId", verificationController.getVerificationStatus);

module.exports = router;