const amqp = require('amqplib');

class RabbitMQService {
  private connection: any | null = null;
  private channel: any | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this._connect();
    return this.connectionPromise;
  }

  private async _connect(): Promise<void> {
    try {
      // Use environment variable or default to CloudAMQP (free tier) for production
      const url = process.env.RABBITMQ_URL || process.env.CLOUDAMQP_URL || 'amqp://localhost:5672';
      
      console.log('Connecting to RabbitMQ...');
      const connection = await amqp.connect(url);
      this.connection = connection;
      this.channel = await connection.createChannel();
      this.isConnected = true;

      // Setup exchange and queues
      await this.setupQueues();

      console.log('✅ Connected to RabbitMQ successfully');
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error);
      this.isConnected = false;
      this.connectionPromise = null;
      // Don't throw error to prevent app crash - fallback to in-memory mode
    }
  }

  private async setupQueues(): Promise<void> {
    if (!this.channel) return;

    try {
      // Setup exchanges
      await this.channel.assertExchange('persona_agents', 'topic', { durable: true });
      await this.channel.assertExchange('agent_coordination', 'fanout', { durable: true });

      // Setup queues for multi-agent communication
      const queues = [
        'agent.spawn',
        'agent.message',
        'agent.response', 
        'agent.coordination',
        'agent.analysis.complete',
        'multi.persona.session',
        'agent.status'
      ];

      for (const queue of queues) {
        await this.channel.assertQueue(queue, { durable: true });
      }

      // Bind queues to exchanges
      await this.channel.bindQueue('agent.spawn', 'persona_agents', 'agent.spawn');
      await this.channel.bindQueue('agent.message', 'persona_agents', 'agent.message.*');
      await this.channel.bindQueue('agent.response', 'persona_agents', 'agent.response.*');
      await this.channel.bindQueue('agent.coordination', 'agent_coordination', '');
      
      console.log('✅ RabbitMQ queues and exchanges setup complete');
    } catch (error) {
      console.error('❌ Failed to setup RabbitMQ queues:', error);
    }
  }

  async publishMessage(
    exchange: string,
    routingKey: string,
    message: any,
    options: any = {}
  ): Promise<void> {
    if (!this.isConnected || !this.channel) {
      console.log('RabbitMQ not connected, using fallback logging:', { exchange, routingKey, message });
      return;
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      await this.channel.publish(exchange, routingKey, messageBuffer, {
        persistent: true,
        timestamp: Date.now(),
        ...options
      });
    } catch (error) {
      console.error('Failed to publish message:', error);
      // Fallback to console logging
      console.log('Fallback message:', { exchange, routingKey, message });
    }
  }

  async consumeMessages(
    queue: string,
    callback: (message: any) => Promise<void>
  ): Promise<void> {
    if (!this.isConnected || !this.channel) {
      console.log('RabbitMQ not connected, cannot consume from queue:', queue);
      return;
    }

    try {
      await this.channel.consume(queue, async (msg: any) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            await callback(content);
            this.channel!.ack(msg);
          } catch (error) {
            console.error('Error processing message:', error);
            this.channel!.nack(msg, false, false); // Don't requeue failed messages
          }
        }
      });
    } catch (error) {
      console.error('Failed to consume messages:', error);
    }
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        // Use the connection close method that exists
        await (this.connection as any).close();
      }
      this.isConnected = false;
      this.connectionPromise = null;
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
    }
  }

  isConnectionHealthy(): boolean {
    return this.isConnected && this.connection !== null && this.channel !== null;
  }
}

// Singleton instance
export const rabbitmqService = new RabbitMQService();

// Message types
export interface InterviewMessage {
  sessionId: string;
  botId: string;
  participantId?: string;
  type: 'start' | 'question' | 'response' | 'complete';
  payload: any;
  timestamp: number;
}

export interface ValidationMessage {
  sessionId: string;
  agentId: string;
  type: 'quality' | 'completeness' | 'bias' | 'relevance';
  data: any;
  timestamp: number;
}

export interface PersonaUpdateMessage {
  personaId: string;
  sessionId: string;
  updates: any;
  insights: any;
  timestamp: number;
}
