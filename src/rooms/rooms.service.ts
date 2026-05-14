import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { MemberRole, RoomType } from '../../prisma-client/tenant';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  private get db() {
    return this.prisma.tenant;
  }

  private async checkExistingUsers(userIds: number[]) {
    const existingUsers = await this.db.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
      },
    });
    if (existingUsers.length !== userIds.length) {
      const existingids = existingUsers.map((u) => u.id);
      const missing = userIds.filter((id) => !existingids.includes(id));
      throw new BadRequestException(
        `users with ids, ${missing.join(',')} not found`,
      );
    }
  }

  private async checkExistingUser(userId: number) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException(`User ${userId} not found`);
    }

    return user;
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

  async createRoom(dto: CreateRoomDto) {
    const { type, memberIds, name, creatorId } = dto;
    if (memberIds.length == 0 && type === 'DIRECT')
      throw new BadRequestException(
        'please add room member for the direct chat',
      );
    if (type === 'GROUP' && !name?.trim()) {
      throw new BadRequestException('please add group name for the chat');
    }

    const allUsers = [...new Set([creatorId, ...memberIds])]; //to remove the dublication
    await this.checkExistingUsers(allUsers);

    const room = await this.db.$transaction(async (manger) => {
      const addNewRoom = await manger.room.create({
        data: {
          type: type,
          name: type === RoomType.GROUP ? name : null,
          members: {
            create: allUsers.map((userId) => ({
              userId,
              role: userId === creatorId ? MemberRole.OWNER : MemberRole.MEMBER,
              lastReadAt: new Date(),
            })),
          },
        },
        include: {
          members: {
            select: {
              user: true,
            },
          },
        },
      });
      return {
        ...addNewRoom,
        members: addNewRoom.members.map((member) => member.user),
      };
    });
    return room;
  }

  async getUserRooms(userId: number) {
    await this.checkExistingUser(userId);
    const rooms = await this.db.room.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        messages: true,
        members: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return rooms.map((room) => {
      const { members, ...roomData } = room;

      return {
        ...roomData,
        users: members.map((m) => m.user),
      };
    });
  }

  async getUserRoomById(roomId: number, userId: number) {
    await this.validateRoomForUserId(roomId, userId);
    const room = await this.db.room.findUnique({
      where: {
        id: roomId,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        messages: {
          include:{
             user:{
              select:{
                id:true,name:true,email:true
              }
             }
             
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    return room;
  }
}
