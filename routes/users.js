const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const db      = require('../config/db');
const { authMiddleware, requireLider } = require('../middleware/auth');

const SAFE_COLS = 'id,name,email,role,dept,initials,points,checkins_count,available,created_at';

// GET /api/users  — todos (autenticado)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT ${SAFE_COLS} FROM users ORDER BY name`);
    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/users  — apenas líder
router.post('/', authMiddleware, requireLider, async (req, res) => {
  try {
    const { name, email, password = 'vol123', role = 'voluntario', dept } = req.body;
    if (!name || !email || !dept)
      return res.status(400).json({ error: 'name, email e dept são obrigatórios' });

    const initials = name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const hash     = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO users (name,email,password_hash,role,dept,initials) VALUES (?,?,?,?,?,?)',
      [name.trim(), email.trim(), hash, role, dept, initials]
    );

    const [rows] = await db.query(`SELECT ${SAFE_COLS} FROM users WHERE id = ?`, [result.insertId]);
    
    req.io.emit('user:new', { user: rows[0] });
    res.status(201).json({ user: rows[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    res.status(500).json({ error: 'Erro interno' });
  }
});

// PATCH /api/users/:id/availability  — líder altera disponibilidade
router.patch('/:id/availability', authMiddleware, requireLider, async (req, res) => {
  try {
    const { available } = req.body;
    await db.query('UPDATE users SET available = ? WHERE id = ?', [available ? 1 : 0, req.params.id]);
    const [rows] = await db.query(`SELECT ${SAFE_COLS} FROM users WHERE id = ?`, [req.params.id]);
    req.io.emit('user:updated', { user: rows[0] });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// DELETE /api/users/:id  — apenas líder
router.delete('/:id', authMiddleware, requireLider, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id)
      return res.status(400).json({ error: 'Você não pode remover sua própria conta' });

    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    req.io.emit('user:deleted', { id: parseInt(req.params.id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
