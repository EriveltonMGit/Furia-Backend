const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const dotenv = require("dotenv")
const morgan = require("morgan")
const { connectDB } = require("./config/firebase")
const cookieParser = require("cookie-parser")

dotenv.config()

const app = express()

// Configuração melhorada de CORS
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://furia-fan-page.vercel.app",
    "https://furia-wheat.vercel.app" 
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"]
}

app.get('/', (req, res) => {
  res.json({ success: true, message: 'API Furia Backend está ativa!' });
});
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

// Middlewares
app.use(cookieParser())
app.use(bodyParser.json())
app.use(morgan("dev"))

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

// Conexão com o banco de dados
connectDB().catch(err => {
  console.error("Falha na conexão com o Firebase:", err)
  process.exit(1)
})

// Rotas
app.use("/api/auth", require("./routes/auth.routes"))
app.use("/api/users", require("./routes/user.routes"))
app.use("/api/profile", require("./routes/profile.routes"))

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP" })
})

// Rota 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Rota não encontrada" })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    success: false,
    message: "Erro interno no servidor",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`)
})