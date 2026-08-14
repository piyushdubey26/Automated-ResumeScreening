import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  socket.on('join_room', (roomId: string) => {
    socket.join(roomId);
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` ResumeAI Engine Server is running on port ${PORT}`);
  console.log(` Health check URL: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});
