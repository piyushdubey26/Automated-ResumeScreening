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

import { ContinuousLearningEngine } from './services/continuousLearning';

// Server-Side Daily Continuous Learning Automated Pipeline Scheduler (runs every 24 hours)
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
setInterval(() => {
  try {
    console.log('[ContinuousLearningEngine] Scheduled daily evaluation cycle triggered...');
    const log = ContinuousLearningEngine.runDailyLearningCycle(3);
    console.log(`[ContinuousLearningEngine] Daily cycle completed with decision: ${log.decision} (${log.reason})`);
  } catch (err) {
    console.error('[ContinuousLearningEngine] Failed daily cycle run:', err);
  }
}, TWENTY_FOUR_HOURS_MS);

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` ResumeAI Engine Server is running on port ${currentPort}`);
  console.log(` Health check URL: http://localhost:${currentPort}/api/health`);
  console.log(` Continuous Learning Scheduler: ACTIVE (Daily 24h Interval)`);
  console.log(`===============================================`);
});
