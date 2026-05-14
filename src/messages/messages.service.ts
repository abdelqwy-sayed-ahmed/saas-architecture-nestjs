import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageStatusType } from '../../prisma-client/tenant';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { TenantContextService } from '../tenant-context/tenant-context.service';
import { MessageSentPayload, RABBITMQ_EXCHANGES, RABBITMQ_ROUTING_KEYS } from '../common/events/message.events';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMQ:RabbitMQService,
    private tenantContext: TenantContextService,
  ) {}

  private get db() {
    return this.prisma.tenant;
  }

  private async validateRoomForUserId(roomId: number, userId: number) {
    const room = await this.db.room.findFirst({
      where: {
        id: roomId,
        AND: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
    });
    if (!room) throw new NotFoundException('room is not found');

    return true;
  }

  private async getRoomMembers(roomId: number, senderId: number) {
    const members = await this.db.roomMember.findMany({
      where: {
        roomId,
        userId: { not: senderId },
      },
      select: {
        userId: true,
      },
    });
    return members;
  }

  async sendMessage(dto: SendMessageDto) {
    const { senderId, content, roomId } = dto;
    await this.validateRoomForUserId(roomId, senderId);
    const members = await this.getRoomMembers(roomId, senderId);

    const message = await this.db.$transaction(async (manger) => {
      const created = await manger.message.create({
        data: {
          senderId: senderId,
          content: content,
          roomId: roomId,
          messageStatus: {
            create: members.map((m) => ({
              recipientId: m.userId,
              status: MessageStatusType.SENT,
            })),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      await manger.room.update({
        where: {
          id: roomId,
        },
        data: {
          updatedAt: new Date(),
        },
      });

      return created;
    });
    //publishe notification outside the transaction
    //if MQ fails - message still saved in the DB
    const tenantId=this.tenantContext.getTenantId()
    if(!tenantId) throw new Error('error fetching tenant id')
    const payload: MessageSentPayload = {
    messageId: message.id,
    roomId: message.roomId,
    senderId: message.senderId,
    content: message.content,
    createdAt: message.createdAt,
    tenantId:tenantId,
    recipientIds: members.map((m) => m.userId),
  };

  this.rabbitMQ.publish(
    RABBITMQ_EXCHANGES.CHAT,
    RABBITMQ_ROUTING_KEYS.MESSAGE_SENT,
    payload,
  );

    return message;
  }

  async getMessages(roomId: number, userId: number,cursor?:number,limit:number=2 ) {
    await this.validateRoomForUserId(roomId, userId);

    const takeLimit = limit ?? 20;

    const messages = await this.db.message.findMany({
      where: {
        roomId,
        deletedAt: null,
        // If cursor provided, fetch messages OLDER than that id
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: { id: 'desc' },     // newest first, client reverses for display
      take: takeLimit + 1,                    // fetch one extra to know if there's a next page
      include: {
        user: { select: { id: true, name: true, email: true } },
        messageStatus: {
          select: {
            recipientId: true,
            status: true,
            updatedAt: true,
          },
        },
      },
    });

    // Determine if there are more pages
    const hasMore = messages.length > takeLimit;
    if (hasMore) messages.pop();          // remove the extra item

    return {
      data: messages,
      hasMore,
      // Client sends this as `cursor` in the next request
      nextCursor: hasMore ? messages[messages.length - 1].id : null,
    };
  }
}
