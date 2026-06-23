const router = require('express').Router();
const db     = require('../config/db');
const { authMiddleware, requireLider } = require('../middleware/auth');

// ── helper: busca escala com voluntários ──────────────────────
async function fetchSchedule(id) {
  const [rows] = await db.query(`
    SELECT s.*, GROUP_CONCAT(sv.user_id) AS vol_ids
    FROM schedules s
    LEFT JOIN schedule_volunteers sv ON sv.schedule_id = s.id
    WHERE s.id = ?
    GROUP BY s.id`, [id]);
  if (!rows[0]) return null;
  const s = rows[0];
  s.vols = s.vol_ids ? s.vol_ids.split(',').map(Number) : [];
  delete s.vol_ids;
  return s;
}

async function fetchAll() {
  const [rows] = await db.query(`
    SELECT s.*, GROUP_CONCAT(sv.user_id ORDER BY sv.user_id) AS vol_ids
    FROM schedules s
    LEFT JOIN schedule_volunteers sv ON sv.schedule_id = s.id
    GROUP BY s.id
    ORDER BY s.date, s.time`);
  return rows.map(s => {
    s.vols = s.vol_ids ? s.vol_ids.split(',').map(Number) : [];
    delete s.vol_ids;
    return s;
  });
}

// GET /api/schedules
router.get('/', authMiddleware, async (req, res) => {
  try {
    res.json({ schedules: await fetchAll() });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/schedules  — líder cria
router.post('/', authMiddleware, requireLider, async (req, res) => {
  try {
    const { title, date, time, dept } = req.body;
    if (!title || !date || !time || !dept)
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });

    const [result] = await db.query(
      'INSERT INTO schedules (title,date,time,dept,created_by) VALUES (?,?,?,?,?)',
      [title, date, time, dept, req.user.id]
    );

    const schedule = await fetchSchedule(result.insertId);

    // Notificação para todos
    await db.query(
      'INSERT INTO notifications (to_role,text) VALUES (?,?)',
      ['all', `Nova escala: ${title} — ${date}`]
    );
    const [notifRows] = await db.query(
      'SELECT * FROM notifications ORDER BY id DESC LIMIT 1'
    );
    req.io.emit('schedule:new', { schedule });
    req.io.emit('notification:new', { notification: notifRows[0] });

    res.status(201).json({ schedule });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// PATCH /api/schedules/:id/status  — líder altera status
router.patch('/:id/status', authMiddleware, requireLider, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending','confirmed'].includes(status))
      return res.status(400).json({ error: 'Status inválido' });

    await db.query('UPDATE schedules SET status = ? WHERE id = ?', [status, req.params.id]);
    const schedule = await fetchSchedule(req.params.id);
    req.io.emit('schedule:updated', { schedule });
    res.json({ schedule });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// PUT /api/schedules/:id/volunteers  — líder define equipe completa
router.put('/:id/volunteers', authMiddleware, requireLider, async (req, res) => {
  try {
    const { volIds = [] } = req.body;
    const scheduleId = req.params.id;

    const conn = await (require('../config/db')).getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('DELETE FROM schedule_volunteers WHERE schedule_id = ?', [scheduleId]);
      if (volIds.length) {
        const values = volIds.map(uid => [scheduleId, uid]);
        await conn.query('INSERT INTO schedule_volunteers (schedule_id,user_id) VALUES ?', [values]);
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback(); throw e;
    } finally {
      conn.release();
    }

    const schedule = await fetchSchedule(scheduleId);

    // Notifica voluntários escalados
    const scTitle = schedule.title;
    for (const uid of volIds) {
      await db.query(
        'INSERT INTO notifications (user_id,to_role,text) VALUES (?,?,?)',
        [uid, 'voluntario', `Você foi escalado para "${scTitle}"`]
      );
    }
    const [notifRows] = await db.query(
      `SELECT * FROM notifications WHERE user_id IN (${volIds.length ? volIds.join(',') : 0}) ORDER BY id DESC LIMIT 1`
    );

    req.io.emit('schedule:updated', { schedule });
    if (notifRows[0]) req.io.emit('notification:new', { notification: notifRows[0] });

    res.json({ schedule });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// DELETE /api/schedules/:id  — líder exclui
router.delete('/:id', authMiddleware, requireLider, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.query('DELETE FROM schedules WHERE id = ?', [id]);
    req.io.emit('schedule:deleted', { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
