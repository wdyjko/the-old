import { Router } from 'express';
import { recognizeVoice } from '../controllers/voiceController';
import { auth } from '../middleware/authMiddleware';

const router = Router();

// Endpoint for voice recognition (requires authentication)
router.post('/recognize', auth, recognizeVoice);

export default router;
