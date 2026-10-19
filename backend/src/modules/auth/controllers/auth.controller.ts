import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dto/auth.dto';
import { UniversityId, UserId } from '../../../common/decorators/auth.decorators';
import { TenantGuard } from '../../../common/guards/tenant.guard';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(TenantGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new student account' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh an access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @Post('verify-email')
  @UseGuards(AuthGuard('jwt'), TenantGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify the signed-in account email with a 6-digit code' })
  async verifyEmail(
    @UserId() userId: string,
    @UniversityId() universityId: string,
    @Body() dto: VerifyEmailDto,
  ) {
    return this.authService.verifyEmail(userId, universityId, dto.code);
  }

  @Post('resend-verification')
  @UseGuards(AuthGuard('jwt'), TenantGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend the email verification code (rate limited)' })
  async resendVerification(@UserId() userId: string, @UniversityId() universityId: string) {
    return this.authService.resendVerification(userId, universityId);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset code' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email, dto.universityId);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset a password with a 6-digit reset code' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.universityId, dto.code, dto.password);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'), TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current user profile' })
  async getMe(@UserId() userId: string, @UniversityId() universityId: string) {
    return this.authService.getProfile(userId, universityId);
  }
}
