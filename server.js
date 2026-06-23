require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE'] },
  pingTimeout: 60000,
});

app.use(cors({ origin: '*' }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json());
app.use((req, _, next) => { req.io = io; next(); });

require('./socket')(io);

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api',           require('./routes/checkins'));

app.get('/health', (_, res) => res.json({
  status: 'ok', app: 'EscalaViva API', version: '1.0.0',
  time: new Date().toISOString()
}));

app.use((_, res) => res.status(404).json({ error: 'Rota não encontrada' }));
app.use((err, _, res, __) => { console.error(err); res.status(500).json({ error: 'Erro interno' }); });

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 EscalaViva API → http://0.0.0.0:${PORT}/health\n`);
});
