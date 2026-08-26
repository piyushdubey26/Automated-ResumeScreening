import http from 'http';
import { Server, Socket } from 'socket.io';
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

io.on('connection', (socket: Socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  socket.on('join_room', (roomId: string) => {
    socket.join(roomId);
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

let currentPort = PORT;

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE' && currentPort !== 8000) {
    console.log(`Port ${currentPort} is already in use (possibly macOS AirPlay). Falling back to port 8000...`);
    currentPort = 8000;
    server.listen(8000);
  } else if (err.code === 'EADDRINUSE' && currentPort === 8000) {
    console.log(`Port 8000 is also in use. Falling back to port 8080...`);
    currentPort = 8080;
    server.listen(8080);
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` ResumeAI Engine Server is running on port ${currentPort}`);
  console.log(` Health check URL: http://localhost:${currentPort}/api/health`);
  console.log(`===============================================`);
});
