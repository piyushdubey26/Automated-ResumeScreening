import app from '../../../backend/dist/app.js';

export default function handler(req: any, res: any) {
  return app(req, res);
}
