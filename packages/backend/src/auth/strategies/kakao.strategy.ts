import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  private readonly logger = new Logger(KakaoStrategy.name);

  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('KAKAO_CLIENT_ID');

    const options: StrategyOptions = {
      clientID: clientID || 'not-configured',
      clientSecret: configService.get<string>('KAKAO_CLIENT_SECRET'),
      callbackURL: configService.get<string>('KAKAO_CALLBACK_URL') || 'http://localhost:3001/api/auth/kakao/callback',
    };
    super(options);

    if (!clientID) {
      this.logger.warn('Kakao OAuth is not configured. Set KAKAO_CLIENT_ID to enable.');
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    const { id, username, _json } = profile;

    const user = {
      providerId: String(id),
      email: _json.kakao_account?.email || `kakao_${id}@lff.local`,
      name: username || _json.properties?.nickname || `User${id}`,
      picture: _json.properties?.profile_image,
      provider: 'kakao',
    };

    done(null, user);
  }
}
