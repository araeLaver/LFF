import { Controller, Post, Body, Get, Query, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService, OAuthUser } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  // Strict rate limit: 3 signups per minute
  @Post('signup')
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  // Strict rate limit: 5 login attempts per minute (brute force protection)
  @Post('login')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: any) {
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      profile: user.profile,
      walletAddress: user.wallet?.address,
    };
  }

  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // Strict rate limit: 3 resend attempts per minute
  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  resendVerification(@CurrentUser() user: any) {
    return this.authService.resendVerificationEmail(user.id);
  }

  // Strict rate limit: 3 password reset requests per minute
  @Post('forgot-password')
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  forgotPassword(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  @Get('validate-reset-token')
  validateResetToken(@Query('token') token: string) {
    return this.authService.validatePasswordResetToken(token);
  }

  // Strict rate limit: 5 password reset attempts per minute
  @Post('reset-password')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    return this.authService.resetPassword(token, password);
  }

  // Google OAuth - Skip throttle for OAuth redirects
  @Get('google')
  @SkipThrottle()
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @SkipThrottle()
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const oauthUser = req.user as OAuthUser;
    const result = await this.authService.oauthLogin(oauthUser);

    // Redirect to frontend with token
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
  }

  // Kakao OAuth - Skip throttle for OAuth redirects
  @Get('kakao')
  @SkipThrottle()
  @UseGuards(AuthGuard('kakao'))
  kakaoAuth() {
    // Guard redirects to Kakao
  }

  @Get('kakao/callback')
  @SkipThrottle()
  @UseGuards(AuthGuard('kakao'))
  async kakaoAuthCallback(@Req() req: any, @Res() res: Response) {
    const oauthUser = req.user as OAuthUser;
    const result = await this.authService.oauthLogin(oauthUser);

    // Redirect to frontend with token
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
  }
}
