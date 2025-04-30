// utils/validation.js

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  // mínimo 6 caracteres, apenas como exemplo
  return typeof password === 'string' && password.length >= 6;
}

// Middleware genérico para checar campos obrigatórios
function validateFields(fields) {
  return (req, res, next) => {
    const errors = [];
    fields.forEach((field) => {
      if (!req.body[field]) {
        errors.push(`O campo '${field}' é obrigatório.`);
      }
    });
    if (errors.length) {
      return res.status(400).json({ success: false, errors });
    }
    next();
  };
}

module.exports = {
  validateEmail,
  validatePassword,
  validateFields,
};
