import importedApp from '../../backend/src/app';

const expressApp = (importedApp as any)?.default ?? importedApp;

export default function handler(req: any, res: any) {
  return expressApp(req, res);
}
