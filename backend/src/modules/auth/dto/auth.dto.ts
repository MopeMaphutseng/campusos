import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty()
  @IsString()
  universityId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty()
  @IsString()
  universityId: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class VerifyEmailDto {
  @ApiProperty({ description: 'The 6-digit code sent to the user email' })
  @IsString()
  @MaxLength(6)
  code: string;
}

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  universityId: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  universityId: string;

  @ApiProperty({ description: 'The 6-digit reset code sent to the user email' })
  @IsString()
  @MaxLength(6)
  code: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    universityId: string;
    enabledModules: string[];
    verificationStatus: string;
    preferences: any;
  };

  @ApiProperty()
  expiresIn: number;

  @ApiPropertyOptional()
  emailVerificationRequired?: boolean;
}
