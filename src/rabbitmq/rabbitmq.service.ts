import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';
import { RABBITMQ_EXCHANGES } from '../common/events/message.events';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqplib.ChannelModel|null=null;
  private channel: amqplib.Channel|null=null;

  constructor(
    private readonly config: ConfigService
  ) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }


  private async connect() {
    try {
      const url = this.config.get<string>('RABBITMQ_URL');
      if (!url) throw new Error('RABBITMQ_URL is not defined');

      this.connection = await amqplib.connect(url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(
        RABBITMQ_EXCHANGES.CHAT,
        'topic',
        { durable: true },
      );

      // Handle unexpected connection drops — attempt reconnect
      this.connection.on('error', (err) => {
        console.error('RabbitMQ connection error', err.message);
      });

      this.connection.on('close', () => {
        console.warn('RabbitMQ connection closed — reconnecting in 5s');
        setTimeout(() => this.connect(), 5000);
      });

      console.log('RabbitMQ connected');
    } catch (err:any) {
      console.error('RabbitMQ connection failed — retrying in 5s', err.message);
      setTimeout(() => this.connect(), 5000);
    }
  }

  private async disconnect() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      // ignore errors on shutdown
    }
  }

  // ─── publish ─────────────────────────────────────────────────────────────────

  publish<T>(exchange: string, routingKey: string, payload: T): void {
    const channel = this.channel;  
  if (!channel) {
    console.error(`Cannot publish [${routingKey}] — channel not ready`);
    return;
  }

    try {
      const buffer = Buffer.from(JSON.stringify(payload));

      channel.publish(exchange, routingKey, buffer, {
        persistent: true,           // message survives RabbitMQ restart
        contentType: 'application/json',
        timestamp: Date.now(),
      });

      console.debug(`Published [${exchange}] ${routingKey}`);
    } catch (err:any) {
      console.error(`Failed to publish [${routingKey}]`, err.message);
     
    }
  }
}