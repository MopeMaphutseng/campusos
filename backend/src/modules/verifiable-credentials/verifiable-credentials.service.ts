import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerifiableCredential as CredentialEntity, CredentialStatus } from './entities/credential.entity';
import { CredentialIssuer } from './services/credential-issuer';
import { CredentialVerifier, VerificationResult } from './services/credential-verifier';
import { DidService } from './services/did-service';
import { CredentialType } from './services/credential-types';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class VerifiableCredentialsService {
  private readonly logger = new Logger(VerifiableCredentialsService.name);
  private didService: DidService;
  private issuer: CredentialIssuer;
  private verifier: CredentialVerifier;
  private revokedIds = new Set<string>();

  constructor(
    @InjectRepository(CredentialEntity) private credentialRepo: Repository<CredentialEntity>,
  ) {
    this.didService = new DidService();
    this.issuer = new CredentialIssuer(this.didService);
    this.verifier = new CredentialVerifier(this.didService);
  }

  async issueCredential(universityId: string, data: {
    holderId: string;
    holderName: string;
    type: CredentialType;
    name: string;
    description?: string;
    courseCode?: string;
    faculty?: string;
    grade?: string;
    skills?: string[];
    issuedBy?: string;
    expirationDate?: Date;
  }): Promise<CredentialEntity> {
    let issuerKey = this.didService.getActiveKeyForIssuer(`did:web:${universityId}.campusos.com`);
    if (!issuerKey) {
      this.didService.createWebDid(universityId);
    }

    const w3cCredential = this.issuer.issueCredential({
      type: data.type,
      issuerDid: `did:web:${universityId}.campusos.com`,
      issuerName: 'CampusOS University',
      subjectDid: `did:key:${data.holderId}`,
      subjectName: data.holderName,
      achievement: data.name,
      description: data.description,
      faculty: data.faculty,
      courseCode: data.courseCode,
      grade: data.grade,
      skills: data.skills,
      issuedBy: data.issuedBy,
      expirationDate: data.expirationDate,
      universityId,
    });

    const credential = this.credentialRepo.create({
      universityId,
      holderId: data.holderId,
      type: data.type,
      name: data.name,
      description: data.description,
      issuanceDate: w3cCredential.issuanceDate,
      expirationDate: w3cCredential.expirationDate,
      status: CredentialStatus.ACTIVE,
      credentialSubject: JSON.stringify(w3cCredential.credentialSubject),
      proof: JSON.stringify(w3cCredential.proof),
      issuerDid: w3cCredential.issuer.id,
      holderDid: w3cCredential.credentialSubject.id,
      credentialUrl: `/credentials/${w3cCredential.id}`,
      qrCodeData: `campusos://credential/${w3cCredential.id}`,
    });

    const saved = await this.credentialRepo.save(credential);
    this.logger.log(`Issued ${data.type} credential to ${data.holderName} (${universityId})`);
    return saved;
  }

  async verifyCredential(id: string): Promise<{
    valid: boolean;
    credential: CredentialEntity;
    details: VerificationResult;
  }> {
    const credential = await this.credentialRepo.findOne({ where: { id } });
    if (!credential) throw new NotFoundException('Credential not found');

    const w3cCredential = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', credential.type],
      id: `urn:uuid:${credential.id}`,
      issuer: { id: credential.issuerDid, name: 'CampusOS University' },
      issuanceDate: credential.issuanceDate,
      expirationDate: credential.expirationDate,
      credentialSubject: JSON.parse(credential.credentialSubject),
      proof: JSON.parse(credential.proof),
    };

    const result = this.verifier.verifyCredential(w3cCredential as any, this.revokedIds);

    return {
      valid: result.verified,
      credential,
      details: result,
    };
  }

  async revokeCredential(universityId: string, id: string, reason: string = 'Revoked by administrator'): Promise<CredentialEntity> {
    const credential = await this.credentialRepo.findOne({ where: { id, universityId } });
    if (!credential) throw new NotFoundException('Credential not found');
    credential.status = CredentialStatus.REVOKED;
    credential.revokedAt = new Date().toISOString() as any;
    this.revokedIds.add(id);
    this.logger.log(`Revoked credential ${id} (${universityId}): ${reason}`);
    return this.credentialRepo.save(credential);
  }

  async findHolderCredentials(universityId: string, holderId: string, query?: PaginationDto): Promise<CredentialEntity[]> {
    return this.credentialRepo.find({
      where: { universityId, holderId, status: CredentialStatus.ACTIVE },
      order: { issuanceDate: 'DESC' },
      take: query?.limit || 50,
    });
  }

  async getHolderStats(universityId: string, holderId: string) {
    const credentials = await this.credentialRepo.find({ where: { universityId, holderId } });
    return {
      totalCredentials: credentials.length,
      activeCredentials: credentials.filter((c) => c.status === CredentialStatus.ACTIVE).length,
      revokedCredentials: credentials.filter((c) => c.status === CredentialStatus.REVOKED).length,
      byType: credentials.reduce((acc, c) => ({
        ...acc,
        [c.type]: (acc[c.type] || 0) + 1,
      }), {} as Record<string, number>),
    };
  }

  generateQrData(credentialId: string): string {
    return `campusos://verify/${credentialId}`;
  }

  async createHolderDid(userId: string, universitySlug: string) {
    return this.didService.createUserDid(userId, universitySlug);
  }
}
