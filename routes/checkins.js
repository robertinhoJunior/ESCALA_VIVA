const router = require('express').Router();
const db     = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// ── CHECK-INS ─────────────────────────────────────────────────

// POST /api/checkins
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { scheduleId } = req.body;
    if (!scheduleId) return res.status(400).json({ error: 'scheduleId obrigatório' });

    // Verifica se o usuário está escalado (voluntários) ou permite tudo (líder)
    if (req.user.role !== 'lider') {
      const [sv] = await db.query(
        'SELECT 1 FROM schedule_volunteers WHERE schedule_id = ? AND user_id = ?',
        [scheduleId, req.user.id]
      );
      if (!sv.length) return res.status(403).json({ error: 'Você não está nesta escala' });
    }

    await db.query(
      'INSERT IGNORE INTO checkins (user_id,schedule_id) VALUES (?,?)',
      [req.user.id, scheduleId]
    );

    // Atualiza contador
    await db.query(
      'UPDATE users SET checkins_count = checkins_count + 1 WHERE id = ? AND NOT EXISTS (SELECT 1 FROM checkins WHERE user_id = ? AND schedule_id = ? LIMIT 1)',
      [req.user.id, req.user.id, scheduleId]
    );

    // Incrementa pontos +10
    await db.query('UPDATE users SET points = points + 10 WHERE id = ?', [req.user.id]);

    const [rows] = await db.query(
      'SELECT * FROM checkins WHERE user_id = ? AND schedule_id = ?',
      [req.user.id, scheduleId]
    );

    req.io.emit('checkin:new', { checkin: rows[0], userId: req.user.id });
    res.json({ checkin: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /api/checkins  — retorna IDs de escalas com check-in do usuário
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT schedule_id FROM checkins WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ checkins: rows.map(r => r.schedule_id) });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── NOTIFICAÇÕES ──────────────────────────────────────────────

// GET /api/notifications
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const role = req.user.role;
    const [rows] = await db.query(`
      SELECT * FROM notifications
      WHERE (to_role = 'all' OR to_role = ? OR user_id = ?)
      ORDER BY created_at DESC LIMIT 50`,
      [role, req.user.id]
    );
    res.json({ notifications: rows });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// PATCH /api/notifications/read-all
router.patch('/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    const role = req.user.role;
    await db.query(`
      UPDATE notifications SET read_at = NOW()
      WHERE read_at IS NULL AND (to_role = 'all' OR to_role = ? OR user_id = ?)`,
      [role, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
