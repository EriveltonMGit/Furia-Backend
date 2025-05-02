// controllers/auth.controller.js
const admin = require('firebase-admin');
const bcrypt = require("bcryptjs");
const { db } = require("../config/firebase");
const { generateToken } = require("../config/jwt");
const { validateEmail, validatePassword } = require("../utils/validation");

// Define opções de cookie
// Corrigido: Usar SameSite=None para cookies cross-origin, combinado com Secure=true em produção
const cookieOptions = {
    expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 90) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // True em produção
    sameSite: process.env.NODE_ENV === "production" ? "None" : "lax", // Use None em produção
    path: "/",
};

// Registrar um novo usuário
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validações
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Preencha todos os campos" });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ success: false, message: "Email inválido" });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({
                success: false,
                message: "Senha deve ter pelo menos 6 caracteres"
            });
        }

        // Verificar se email já existe
        const emailSnapshot = await db.collection("users").where("email", "==", email).get();
        if (!emailSnapshot.empty) {
            return res.status(400).json({ success: false, message: "Email já cadastrado" });
        }

        // Criar usuário
        const hashedPassword = await bcrypt.hash(password, 10);
        const userRef = db.collection("users").doc();
        const now = admin.firestore.Timestamp.now(); // Use timestamp do Firebase

        await userRef.set({
            name,
            email,
            password: hashedPassword,
            role: "user",
            created_at: now,
            updated_at: now
        });

        // Gerar token JWT
        const token = generateToken(userRef.id);
        res.cookie("jwt", token, cookieOptions);

        res.status(201).json({
            success: true,
            message: "Usuário registrado com sucesso",
            user: { id: userRef.id, name, email, created_at: now.toDate() } // Retorne created_at como Date
        });

    } catch (error) {
        console.error("Erro no registro:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao registrar usuário",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};


// Login de usuário
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1) validações
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email e senha são obrigatórios" });
        }

        // 2) busca usuário
        const snap = await db.collection("users").where("email", "==", email).limit(1).get();
        if (snap.empty) {
            return res.status(401).json({ success: false, message: "Credenciais inválidas" });
        }
        const doc = snap.docs[0];
        const user = { id: doc.id, ...doc.data() };

        // 3) compara senha
        // Adiciona verificação se a senha existe (para login social por exemplo)
        if (!user.password) {
            return res.status(401).json({ success: false, message: "Login com senha não permitido para este usuário" });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ success: false, message: "Credenciais inválidas" });
        }

        // 4) gerar token e setar cookie
        const token = generateToken(user.id);
        res.cookie("jwt", token, cookieOptions); // Usa cookieOptions corrigido

        // 5) responder - Remova a senha do objeto user retornado
        const { password: _, ...userData } = user;
        res.status(200).json({
            success: true,
            message: "Login realizado com sucesso",
            user: { ...userData, created_at: user.created_at?.toDate() || null }, // Converte timestamp para Date
        });

    } catch (error) {
        console.error("Erro ao fazer login:", error);
        res.status(500).json({ success: false, message: "Erro ao fazer login", error: error.message });
    }
};

// Obter usuário atual
exports.getMe = async (req, res) => {
    try {
        // O middleware `protect` já anexou o usuário autenticado em `req.user`
        const user = req.user; // req.user já vem do middleware e não inclui a senha

        // Converte timestamp para Date antes de enviar
        const userWithDate = {
            ...user,
            created_at: user.created_at?.toDate() || null,
            updated_at: user.updated_at?.toDate() || null
        };

        res.status(200).json({ success: true, user: userWithDate });

    } catch (error) {
        console.error("Erro ao obter usuário atual:", error);
        // O middleware `protect` já deve ter tratado erros de autenticação (401)
        // Este catch pegaria erros internos APÓS a autenticação bem sucedida
        res.status(500).json({ success: false, message: "Erro interno ao obter usuário", error: error.message });
    }
};

// Logout — limpa o cookie JWT
exports.logout = (req, res) => {
    try {
        res.clearCookie("jwt", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            // Usa SameSite=None para garantir que a remoção funcione cross-origin se o cookie foi setado com None
            sameSite: process.env.NODE_ENV === "production" ? "None" : "lax",
            path: "/",
            // Adiciona domain explicitamente para garantir que o cookie seja removido do domínio correto
            // Isso pode ser necessário dependendo de como o cookie foi setado inicialmente
            // Cuidado: se estiver usando subdomínios, pode precisar de um ajuste mais fino
            // domain: '.yourrenderdomain.com', // Exemplo: substitua pelo domínio do seu backend render
        });
        res.status(200).json({ success: true, message: "Logout realizado com sucesso" });
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        res.status(500).json({ success: false, message: "Erro ao fazer logout", error: error.message });
    }
};

// Google Login
exports.googleLogin = async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ success: false, message: 'ID token é obrigatório' });
    }

    try {
        // 1. Verifica o ID token junto ao Firebase Admin SDK
        const decoded = await admin.auth().verifyIdToken(token);
        const { uid, email, name, picture } = decoded;

        // 2. Procura usuário existente no Firestore usando o UID do Firebase Auth
        let userDoc = await db.collection('users').doc(uid).get();

        // 3. Se não existe, cria um novo
        if (!userDoc.exists) {
            const now = admin.firestore.Timestamp.now();
            await db.collection('users').doc(uid).set({
                name: name || email,
                email,
                role: 'user',
                picture,                 // opcional, avatar do Google
                // Não armazena senha para login social
                created_at: now,
                updated_at: now
            });
            userDoc = await db.collection('users').doc(uid).get();
        }

        // 4. Gera o JWT do seu sistema (UID do Firebase Auth)
        const jwtToken = generateToken(uid);

        // Usa cookieOptions corrigido para setar o cookie
        res.cookie('jwt', jwtToken, cookieOptions);

        // 5. Retorna a mesma carga de registro/login
        const data = userDoc.data();
        // Remova a senha se existir (não deveria para login social)
        const { password, ...userData } = data;

        return res.json({
            success: true,
            message: 'Autenticado via Google com sucesso',
            user: {
                id: userDoc.id,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                picture: userData.picture,
                created_at: userData.created_at?.toDate() || null, // Converte timestamp
            }
        });

    } catch (err) {
        console.error('Erro no googleLogin:', err);
        // Pode retornar um erro 401 se o token do Google for inválido/expirado
        return res.status(401).json({ success: false, message: 'Falha na autenticação Google', error: err.message });
    }
};