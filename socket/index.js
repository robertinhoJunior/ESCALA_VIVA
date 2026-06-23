const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'escalaviva_secret_2026';

module.exports = function setupSocket(io) {
  // Autenticação via token no handshake
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Token obrigatório'));
      socket.user = jwt.verify(token, SECRET);
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    const { id, name, role } = socket.user;
    console.log(`🔌 Conectado: ${name} (${role}) [${socket.id}]`);

    // Entra em sala por papel
    socket.join(role);
    socket.join(`user:${id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Desconectado: ${name}`);
    });

    // Ping/pong para keepalive
    socket.on('ping', () => socket.emit('pong'));
  });

  // Helpers para emitir para papéis específicos
  io.toRole = (role, event, data) => {
    if (role === 'all') io.emit(event, data);
    else io.to(role).emit(event, data);
  };

  io.toUser = (userId, event, data) => {
    io.to(`user:${userId}`).emit(event, data);
  };

  return io;
};
