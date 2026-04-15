import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TenantModule } from './tenant/tenant.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes it available everywhere without re-importing
    }),
    TenantModule,
     PrismaModule,
      UsersModule,
       TenantsModule
      ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
