// verification.controller.js
const multer = require('multer');
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${GEMINI_API_KEY}`;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

exports.verifyIdentity = [
  upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      if (!req.files || !req.files.idDocument || !req.files.selfie) {
        return res.status(400).json({ success: false, message: 'Envie o documento de identidade e a selfie.' });
      }

      const idDocumentFile = req.files.idDocument[0];
      const selfieFile = req.files.selfie[0];

      const prompt = "Verifique se a pessoa na selfie corresponde à foto no documento de identidade. Retorne apenas 'correspondência' ou 'não correspondência'.";

      const requestData = {
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: idDocumentFile.mimetype,
                  data: idDocumentFile.buffer.toString("base64")
                }
              },
              {
                inline_data: {
                  mime_type: selfieFile.mimetype,
                  data: selfieFile.buffer.toString("base64")
                }
              }
            ]
          }
        ]
      };

      const { data } = await axios.post(GEMINI_API_URL, requestData);
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase();

      if (resultText?.includes("correspondência")) {
        return res.json({ success: true, faceVerified: true });
      } else {
        return res.json({ success: false, faceVerified: false, message: 'Rosto não corresponde ao documento.' });
      }

    } catch (error) {
      console.error("Erro ao chamar o Gemini:", error.response?.data || error.message);
      return res.status(500).json({ success: false, message: "Erro ao verificar identidade.", error: error.message });
    }
  }
];
