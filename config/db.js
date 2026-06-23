const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306'),
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'escalaviva',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',
  timezone:           '+00:00',
});

// Verifica conexão na inicialização
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL conectado com sucesso');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Erro ao conectar MySQL:', err.message);
    process.exit(1);
  });

module.exports = pool;
