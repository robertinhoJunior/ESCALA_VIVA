const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'escalaviva_secret_2026';

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'Token não fornecido' });

  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

function requireLider(req, res, next) {
  if (req.user?.role !== 'lider')
    return res.status(403).json({ error: 'Acesso restrito ao Líder' });
  next();
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    SECRET,
    { expiresIn: '30d' }
  );
}

module.exports = { authMiddleware, requireLider, signToken };
