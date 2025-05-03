const express = require("express");
const router = express.Router();
const verificationController = require("../controllers/verification.controller");
// const { protect } = require("../middleware/auth.middleware"); // Remova a importação do middleware, pois não estamos usando proteção aqui

// Rota para verificar a identidade e salvar o resultado (sem proteção)
router.post("/verify-identity", verificationController.verifyIdentity);
router.post("/save-result", /* protect, */ verificationController.saveVerificationResult); // Mantemos a rota de salvar, sem proteção por enquanto
router.post("/complete-verification", verificationController.completeVerification); // ✅ Adicione o controller aqui
module.exports = router;