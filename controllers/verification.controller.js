const { getGeminiResponse } = require("../utils/gemini");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { db, admin } = require("../config/firebase"); // Importe o db

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueFilename = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueFilename);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Apenas imagens são permitidas"));
        }
    },
}).fields([
    { name: "idDocument", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
]);

exports.verifyIdentity = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        try {
            if (!req.files || !req.files.idDocument || !req.files.selfie) {
                return res.status(400).json({ success: false, message: "Documento de identidade e selfie são obrigatórios" });
            }

            // ✅ Obter o userId do corpo da requisição
            const { userId } = req.body;
            if (!userId) {
                return res.status(400).json({ success: false, message: "ID do usuário é obrigatório no corpo da requisição" });
            }

            const idDocumentPath = req.files.idDocument[0].path;
            const selfiePath = req.files.selfie[0].path;

            const idDocumentBase64 = fs.readFileSync(idDocumentPath, { encoding: "base64" });
            const selfieBase64 = fs.readFileSync(selfiePath, { encoding: "base64" });

            const prompt = `Analise as duas imagens fornecidas:
            1. A primeira imagem é um documento de identidade oficial (RG, CNH ou passaporte).
            2. A segunda imagem é uma selfie tirada no momento.

            Verifique se:
            - As características faciais (rosto) correspondem entre as imagens
            - A pessoa na selfie parece ser a mesma do documento
            - Não há indícios de fraude ou manipulação nas imagens

            Retorne um JSON com a seguinte estrutura:
            {
                "match": boolean (true se houver correspondência),
                "confidence": number (0 a 1, nível de confiança),
                "reasons": string[] (razões para a decisão)
            }`;

            // Obter resposta do Gemini
            const geminiResponse = await getGeminiResponse(prompt, [
                { mimeType: "image/jpeg", data: idDocumentBase64 },
                { mimeType: "image/jpeg", data: selfieBase64 },
            ]);

            // Limpar arquivos temporários
            fs.unlinkSync(idDocumentPath);
            fs.unlinkSync(selfiePath);

            let verificationResult;
            try {
                verificationResult = JSON.parse(geminiResponse);
            } catch (parseError) {
                // Se não conseguir parsear o JSON, tenta analisar o texto
                const isMatch =
                    geminiResponse.toLowerCase().includes("correspondência") ||
                    geminiResponse.toLowerCase().includes("match") ||
                    geminiResponse.toLowerCase().includes("mesma pessoa");

                // Extrair pontuação de confiança se disponível
                let confidence = 0;
                const confidenceMatch = geminiResponse.match(/(\d+\.\d+)/);
                if (confidenceMatch && confidenceMatch[1]) {
                    confidence = Number.parseFloat(confidenceMatch[1]);
                }
                verificationResult = { match: isMatch, confidence };
            }

            // Salvar o resultado da verificação no banco de dados
            const profileRef = db.collection('profiles').doc(userId);
            await profileRef.set({
                verification_status: verificationResult.match ? 'verified' : 'pending',
                face_verified: verificationResult.match,
                verification_confidence: verificationResult.confidence,
                verification_date: admin.firestore.Timestamp.fromDate(new Date()), // Usar a data atual do servidor
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            res.status(200).json({
                success: true,
                faceVerified: verificationResult.match,
                confidence: verificationResult.confidence,
                reasons: verificationResult.reasons,
                message: verificationResult.match ? "Verificação concluída e salva com sucesso" : "As faces não correspondem",
            });

        } catch (error) {
            console.error("Erro na verificação de identidade:", error);
            res.status(500).json({ success: false, message: "Erro ao processar a verificação de identidade" });
        }
    });
};

// Rota para salvar o resultado (pode ser útil para outros cenários, mantemos)
// Em verification.controller.js, modifique a rota save-result:
exports.saveVerificationResult = async (req, res) => {
  try {
    const { userId, faceVerified, confidence } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "ID do usuário é obrigatório" });
    }

    // Atualizar o perfil
    const profileRef = db.collection('profiles').doc(userId);
    await profileRef.update({
      verification_status: faceVerified ? 'verified' : 'pending',
      face_verified: faceVerified,
      verification_confidence: confidence,
      verification_date: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Atualizar também o documento do usuário principal se necessário
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      faceVerified: faceVerified,
      verificationDate: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ 
      success: true, 
      message: "Resultado da verificação salvo com sucesso" 
    });

  } catch (error) {
    console.error("Erro ao salvar verificação:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erro ao salvar resultado da verificação" 
    });
  }
  
};

exports.completeVerification = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "ID do usuário é obrigatório" });
    }

    // Atualizar o status de verificação para 'completed'
    const profileRef = db.collection('profiles').doc(userId);
    await profileRef.update({
      verification_status: 'completed',
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Atualizar também o documento do usuário principal se necessário
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      verificationCompleted: true,
      verificationCompletionDate: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({
      success: true,
      message: "Verificação marcada como completa com sucesso"
    });

  } catch (error) {
    console.error("Erro ao completar verificação:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao completar o processo de verificação"
    });
  }
};