import { Request, Response } from 'express';
import { z } from 'zod';
import { ChatService } from '../services/chatService';

const startChatSchema = z.object({
  participantIds: z.array(z.string().uuid()).min(1),
});

const sendMessageSchema = z.object({
  content: z.string().min(1),
  attachmentUrl: z.string().optional(),
});

export class ChatController {
  static async listConversations(req: Request, res: Response): Promise<void> {
    try {
      const conversations = await ChatService.getConversations(req.user?.userId || '');
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve active chats' });
    }
  }

  static async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const messages = await ChatService.getMessages(id, req.user?.userId || '');
      res.json(messages);
    } catch (error: any) {
      res.status(403).json({ error: error.message || 'Access denied' });
    }
  }

  static async createChat(req: Request, res: Response): Promise<void> {
    try {
      const parsed = startChatSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      const conversation = await ChatService.createConversation(
        parsed.data.participantIds,
        req.user?.userId || ''
      );
      res.status(201).json(conversation);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to initialize chat thread' });
    }
  }

  static async send(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const parsed = sendMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      const msg = await ChatService.sendMessage(
        id,
        req.user?.userId || '',
        parsed.data.content,
        parsed.data.attachmentUrl
      );
      res.status(201).json(msg);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to dispatch message' });
    }
  }
}
