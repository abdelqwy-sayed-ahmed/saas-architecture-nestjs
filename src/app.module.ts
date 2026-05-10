import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TenantContextModule } from './tenant-context/tenant-context.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { TenantManagementModule } from './tenant-management/tenant-management.module';
import { RommsModule } from './rooms/rooms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    TenantContextModule,
    PrismaModule,
    UsersModule,
    TenantManagementModule,
    RommsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
