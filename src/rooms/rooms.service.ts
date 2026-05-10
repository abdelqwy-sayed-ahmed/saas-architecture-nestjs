import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { MemberRole, RoomType } from '../../prisma-client/tenant';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllRooms() {
    return await this.prisma.tenant.room.findMany({
      include: {
        members: true,
        messages: true,
      },
    });
  }

  private async checkExistingUsers(userIds: number[]) {
    const existingUsers = await this.prisma.tenant.user.findMany({
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
        `users with the following isd are not found :${missing.join(',')}`,
      );
    }
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

    const room = await this.prisma.tenant.$transaction(async (manger) => {
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
    const rooms = await this.prisma.tenant.room.findMany({
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
}
