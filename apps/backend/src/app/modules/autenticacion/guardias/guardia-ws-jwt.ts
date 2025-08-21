import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class GuardiaWsJwt implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const token = this.extractTokenFromHandshake(client);
      
      if (!token) {
        throw new WsException('Token no encontrado');
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = payload;
      
      return true;
    } catch (err) {
      throw new WsException('Token inválido');
    }
  }

  private extractTokenFromHandshake(client: Socket): string | undefined {
    const token = client.handshake.auth?.token || client.handshake.headers?.authorization;
    
    if (token && token.startsWith('Bearer ')) {
      return token.split(' ')[1];
    }
    
    return token;
  }
}