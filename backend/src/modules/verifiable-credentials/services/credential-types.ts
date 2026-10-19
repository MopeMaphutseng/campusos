import * as crypto from 'crypto';

export interface VerifiableCredential {
  '@context': string[];
  type: string[];
  id: string;
  issuer: {
    id: string;
    name: string;
    image?: string;
  };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id: string;
    name: string;
    achievement: string;
    description?: string;
    faculty?: string;
    courseCode?: string;
    grade?: string;
    skills?: string[];
    issuedBy?: string;
  };
  credentialStatus?: {
    id: string;
    type: string;
    statusListIndex: string;
    statusListCredential: string;
  };
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
  };
}

export interface VerifiablePresentation {
  '@context': string[];
  type: string[];
  id: string;
  holder: string;
  verifiableCredential: VerifiableCredential[];
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
  };
}

export interface SigningKey {
  id: string;
  publicKey: string;
  privateKey: string;
  algorithm: 'Ed25519';
  created: Date;
  rotatedAt?: Date;
  active: boolean;
}

export interface RevocationEntry {
  credentialId: string;
  revokedAt: Date;
  reason: string;
  universityId: string;
}

export type CredentialType =
  | 'CourseCertificate'
  | 'SkillBadge'
  | 'ScholarshipAward'
  | 'MentorshipCompletion'
  | 'InnovationProject'
  | 'CompetitionAward'
  | 'InternshipCompletion';

export const CREDENTIAL_CONTEXTS = [
  'https://www.w3.org/2018/credentials/v1',
  'https://www.w3.org/2018/credentials/examples/v1',
];

export const CREDENTIAL_TYPE_MAP: Record<CredentialType, string[]> = {
  CourseCertificate: ['VerifiableCredential', 'CourseCertificate'],
  SkillBadge: ['VerifiableCredential', 'SkillBadge'],
  ScholarshipAward: ['VerifiableCredential', 'ScholarshipAward'],
  MentorshipCompletion: ['VerifiableCredential', 'MentorshipCompletion'],
  InnovationProject: ['VerifiableCredential', 'InnovationProject'],
  CompetitionAward: ['VerifiableCredential', 'CompetitionAward'],
  InternshipCompletion: ['VerifiableCredential', 'InternshipCompletion'],
};
