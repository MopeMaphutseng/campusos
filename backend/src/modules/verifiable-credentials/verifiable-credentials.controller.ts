import {
  Controller, Get, Post, Patch,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { VerifiableCredentialsService } from './verifiable-credentials.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserId, UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CredentialType } from './entities/credential.entity';

@ApiTags('Verifiable Credentials')
@Controller('verifiable-credentials')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class VerifiableCredentialsController {
  constructor(private vcService: VerifiableCredentialsService) {}

  @Post('issue')
  @ApiOperation({ summary: 'Issue a verifiable credential' })
  async issueCredential(
    @UniversityId() universityId: string,
    @Body() body: {
      holderId: string;
      type: CredentialType;
      name: string;
      description?: string;
      courseCode?: string;
      skill?: string;
      score?: number;
      expirationDate?: string;
    },
  ) {
    return this.vcService.issueCredential(universityId, body);
  }

  @Get('holder/:holderId')
  @ApiOperation({ summary: 'Get credentials for a holder' })
  @ApiParam({ name: 'holderId', type: String })
  async findHolderCredentials(
    @UniversityId() universityId: string,
    @Param('holderId') holderId: string,
    @Query() query: PaginationDto,
  ) {
    return this.vcService.findHolderCredentials(universityId, holderId, query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get own credentials' })
  async getMyCredentials(
    @UniversityId() universityId: string,
    @UserId() userId: string,
  ) {
    return this.vcService.findHolderCredentials(universityId, userId);
  }

  @Get('verify/:id')
  @ApiOperation({ summary: 'Verify a credential by ID' })
  @ApiParam({ name: 'id', type: String })
  async verifyCredential(@Param('id') id: string) {
    return this.vcService.verifyCredential(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get credential by ID' })
  @ApiParam({ name: 'id', type: String })
  async findCredentialById(@Param('id') id: string) {
    return this.vcService.findCredentialById(id);
  }

  @Patch(':id/revoke')
  @ApiOperation({ summary: 'Revoke a credential' })
  @ApiParam({ name: 'id', type: String })
  async revokeCredential(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.vcService.revokeCredential(universityId, id);
  }

  @Get('stats/:holderId')
  @ApiOperation({ summary: 'Get holder credential stats' })
  @ApiParam({ name: 'holderId', type: String })
  async getHolderStats(
    @UniversityId() universityId: string,
    @Param('holderId') holderId: string,
  ) {
    return this.vcService.getHolderStats(universityId, holderId);
  }
}
