import { Router } from 'express';
import multer from 'multer';
import { authenticateJWT, requirePlan } from '../middleware/auth';
import {
  uploadAndParseResume,
  getResumeById,
  getLatestResume,
  getResumeFeedback,
  rewriteBullet,
  generateMockInterview,
  getApplications,
  addApplication,
  deleteApplication
} from '../controllers/resumeController';

import { extractTextFromBuffer } from '../utils/fileExtractor';

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

router.post('/upload', authenticateJWT, upload.single('file'), uploadAndParseResume);
router.post('/extract-text', authenticateJWT, upload.single('file'), async (req, res) => {
  try {
    const reqFile = (req as any).file;
    if (!reqFile) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    if (reqFile.size > 10 * 1024 * 1024) {
      return res.status(413).json({ success: false, error: 'File must be 10MB or smaller.' });
    }
    const text = await extractTextFromBuffer(reqFile.buffer, reqFile.originalname || 'file.pdf', reqFile.mimetype);
    return res.json({ success: true, text });
  } catch (err: any) {
    console.error('Text extraction error:', err);
    const isUnsupported = err.message?.includes('Unsupported file type');
    return res.status(isUnsupported ? 415 : 500).json({ 
      success: false, 
      error: isUnsupported ? 'Unsupported file type.' : (err.message || 'Failed to extract text from file') 
    });
  }
});

router.post('/rewrite', authenticateJWT, requirePlan('pro'), rewriteBullet);
router.post('/mock-interview', authenticateJWT, requirePlan('pro'), generateMockInterview);

// Static routes first
router.get('/latest', authenticateJWT, getLatestResume);
router.get('/applications', authenticateJWT, getApplications);
router.post('/applications', authenticateJWT, addApplication);
router.delete('/applications/:id', authenticateJWT, deleteApplication);

// Parameter routes last
router.get('/:id', authenticateJWT, getResumeById);
router.get('/:id/feedback', authenticateJWT, getResumeFeedback);

export default router;
