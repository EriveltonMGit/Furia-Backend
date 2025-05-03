const admin = require("firebase-admin")
const dotenv = require("dotenv")

dotenv.config()

// Verificar variáveis necessárias
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL'
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Variável de ambiente ${envVar} não está definida`)
  }
}

// Configuração do Firebase
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
}

let firebaseApp
try {
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
  console.log("Firebase Admin inicializado com sucesso")
} catch (error) {
  console.error("Erro ao inicializar Firebase:", error)
  process.exit(1)
}

const db = admin.firestore()

const connectDB = async () => {
  try {
    // Testar conexão
    await db.listCollections()
    console.log("Conectado ao Firestore")
  } catch (error) {
    console.error("Erro ao conectar ao Firestore:", error)
    throw error
  }
}

module.exports = {
  admin,
  db,
  connectDB
}