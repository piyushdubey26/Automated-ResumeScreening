import prisma from '../config/db';
import { io } from '../server';

export class ChatService {
  static async getConversations(userId: string) {
    return prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: { select: { name: true } },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async getMessages(conversationId: string, userId: string) {
    // 1. Verify membership
    const isParticipant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!isParticipant) {
      throw new Error('Access denied: You are not a participant in this conversation');
    }

    return prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async createConversation(participantIds: string[], creatorUserId: string) {
    const allIds = Array.from(new Set([creatorUserId, ...participantIds]));

    // Fetch participant roles
    const users = await prisma.user.findMany({
      where: { id: { in: allIds } },
      include: { role: true },
    });

    if (users.length !== allIds.length) {
      throw new Error('One or more conversation participants do not exist');
    }

    // Role-authorized verification (Section 23)
    const roles = users.map((u) => u.role.name);
    const hasMultiplePatients = roles.filter((r) => r === 'PATIENT').length > 1;

    if (hasMultiplePatients) {
      throw new Error('Security restriction: Patients are not permitted to chat with other patients');
    }

    // Check if conversation already exists (for 1-on-1 chats)
    if (allIds.length === 2) {
      const existing = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { participants: { some: { userId: allIds[0] } } },
            { participants: { some: { userId: allIds[1] } } },
          ],
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: { select: { name: true } },
                },
              },
            },
          },
        },
      });

      if (existing) {
        return existing;
      }
    }

    // Create conversation
    return prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.create({
        data: {
          isGroup: allIds.length > 2,
        },
      });

      for (const uid of allIds) {
        await tx.conversationParticipant.create({
          data: {
            conversationId: conversation.id,
            userId: uid,
          },
        });
      }

      const fullConvo = await tx.conversation.findUnique({
        where: { id: conversation.id },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: { select: { name: true } },
                },
              },
            },
          },
          messages: true,
        },
      });

      return fullConvo;
    });
  }

  static async sendMessage(conversationId: string, senderId: string, content: string, attachmentUrl?: string) {
    // 1. Verify membership
    const isParticipant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: senderId },
      },
    });

    if (!isParticipant) {
      throw new Error('Access denied: Cannot send message to a conversation you are not in');
    }

    return prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId,
          senderId,
          content,
          attachmentUrl,
        },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      // Update last activity timestamp in conversation
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      // Notify Socket room
      io.to(`chat:${conversationId}`).emit('message_received', msg);

      return msg;
    });
  }
}
