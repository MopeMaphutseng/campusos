import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import {
  VerifiableCredential,
  CredentialType,
  CREDENTIAL_CONTEXTS,
  CREDENTIAL_TYPE_MAP,
} from './credential-types';
import { DidService } from './did-service';

export class CredentialIssuer {
  constructor(private didService: DidService) {}

  issueCredential(params: {
    type: CredentialType;
    issuerDid: string;
    issuerName: string;
    subjectDid: string;
    subjectName: string;
    achievement: string;
    description?: string;
    faculty?: string;
    courseCode?: string;
    grade?: string;
    skills?: string[];
    issuedBy?: string;
    expirationDate?: Date;
    universityId: string;
  }): VerifiableCredential {
    const key = this.didService.getActiveKeyForIssuer(params.issuerDid);
    if (!key) {
      throw new Error(`No active signing key found for issuer ${params.issuerDid}`);
    }

    const credentialId = `urn:uuid:${uuidv4()}`;
    const now = new Date();

    const credential: Omit<VerifiableCredential, 'proof'> = {
      '@context': [...CREDENTIAL_CONTEXTS],
      type: CREDENTIAL_TYPE_MAP[params.type],
      id: credentialId,
      issuer: {
        id: params.issuerDid,
        name: params.issuerName,
      },
      issuanceDate: now.toISOString(),
      expirationDate: params.expirationDate?.toISOString(),
      credentialSubject: {
        id: params.subjectDid,
        name: params.subjectName,
        achievement: params.achievement,
        description: params.description,
        faculty: params.faculty,
        courseCode: params.courseCode,
        grade: params.grade,
        skills: params.skills,
        issuedBy: params.issuedBy,
      },
    };

    const proof = this.signCredential(credential, key);

    return {
      ...credential,
      proof,
    };
  }

  private signCredential(credential: any, key: { id: string; privateKey: string }): VerifiableCredential['proof'] {
    const now = new Date();
    const canonicalJson = JSON.stringify(credential, Object.keys(credential).sort());
    const hash = crypto.createHash('sha256').update(canonicalJson).digest('hex');

    const privateKeyObj = crypto.createPrivateKey({
      key: Buffer.from(key.privateKey, 'base64'),
      format: 'der',
      type: 'pkcs8',
    });

    const signature = crypto.sign(null, Buffer.from(hash), privateKeyObj);

    return {
      type: 'Ed25519Signature2020',
      created: now.toISOString(),
      verificationMethod: key.id,
      proofPurpose: 'assertionMethod',
      proofValue: `z${(signature as any).toString('base58btc')}`,
    };
  }

  generatePresentation(params: {
    credentials: VerifiableCredential[];
    holderDid: string;
  }): any {
    const key = this.didService.getActiveKeyForIssuer(params.holderDid);
    const now = new Date();

    const presentation = {
      '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
      type: ['VerifiablePresentation'],
      id: `urn:uuid:${uuidv4()}`,
      holder: params.holderDid,
      verifiableCredential: params.credentials,
    };

    if (key) {
      const canonicalJson = JSON.stringify(presentation, Object.keys(presentation).sort());
      const hash = crypto.createHash('sha256').update(canonicalJson).digest('hex');
      const privateKeyObj = crypto.createPrivateKey({
        key: Buffer.from(key.privateKey, 'base64'),
        format: 'der',
        type: 'pkcs8',
      });
      const signature = crypto.sign(null, Buffer.from(hash), privateKeyObj);

      return {
        ...presentation,
        proof: {
          type: 'Ed25519Signature2020',
          created: now.toISOString(),
          verificationMethod: key.id,
          proofPurpose: 'authentication',
          proofValue: `z${(signature as any).toString('base58btc')}`,
        },
      };
    }

    return presentation;
  }
}
