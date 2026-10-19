import * as crypto from 'crypto';
import { VerifiableCredential, VerifiablePresentation } from './credential-types';
import { DidService } from './did-service';

export interface VerificationResult {
  verified: boolean;
  checks: {
    signature: boolean;
    expiration: boolean;
    revocation: boolean;
    issuer: boolean;
  };
  errors: string[];
}

export class CredentialVerifier {
  constructor(private didService: DidService) {}

  verifyCredential(credential: VerifiableCredential, revokedIds: Set<string>): VerificationResult {
    const errors: string[] = [];
    const checks = {
      signature: false,
      expiration: false,
      revocation: false,
      issuer: false,
    };

    // Check revocation
    if (revokedIds.has(credential.id)) {
      errors.push('Credential has been revoked');
    } else {
      checks.revocation = true;
    }

    // Check expiration
    if (credential.expirationDate) {
      const expiry = new Date(credential.expirationDate);
      if (expiry < new Date()) {
        errors.push('Credential has expired');
      } else {
        checks.expiration = true;
      }
    } else {
      checks.expiration = true;
    }

    // Check issuer exists
    const issuerKey = this.didService.getActiveKeyForIssuer(credential.issuer.id);
    if (!issuerKey) {
      errors.push(`Issuer DID not found: ${credential.issuer.id}`);
    } else {
      checks.issuer = true;
    }

    // Verify signature
    try {
      const { proof, ...credentialWithoutProof } = credential;
      const canonicalJson = JSON.stringify(credentialWithoutProof, Object.keys(credentialWithoutProof).sort());
      const hash = crypto.createHash('sha256').update(canonicalJson).digest('hex');

      const verificationMethod = proof.verificationMethod;
      const key = this.didService.getKeyById(verificationMethod);
      if (!key) {
        errors.push('Verification key not found');
      } else {
        const publicKeyObj = crypto.createPublicKey({
          key: Buffer.from(key.publicKey, 'base64'),
          format: 'der',
          type: 'spki',
        });

        const signatureBuffer = Buffer.from(proof.proofValue.slice(1), 'base58btc');
        const verified = crypto.verify(null, Buffer.from(hash), publicKeyObj, signatureBuffer);
        checks.signature = verified;
        if (!verified) errors.push('Signature verification failed');
      }
    } catch (err) {
      errors.push(`Signature verification error: ${err.message}`);
    }

    return {
      verified: errors.length === 0,
      checks,
      errors,
    };
  }

  verifyPresentation(presentation: VerifiablePresentation, revokedIds: Set<string>): VerificationResult {
    const errors: string[] = [];
    const checks = {
      signature: false,
      expiration: true,
      revocation: false,
      issuer: false,
    };

    // Verify each credential in the presentation
    let allCredentialsValid = true;
    for (const cred of presentation.verifiableCredential) {
      const result = this.verifyCredential(cred, revokedIds);
      if (!result.verified) {
        allCredentialsValid = false;
        errors.push(...result.errors.map(e => `Credential ${cred.id}: ${e}`));
      }
    }

    if (allCredentialsValid) {
      checks.revocation = true;
      checks.issuer = true;
    }

    // Verify presentation proof
    try {
      const { proof, ...presentationWithoutProof } = presentation;
      const canonicalJson = JSON.stringify(presentationWithoutProof, Object.keys(presentationWithoutProof).sort());
      const hash = crypto.createHash('sha256').update(canonicalJson).digest('hex');

      const key = this.didService.getKeyById(proof.verificationMethod);
      if (key) {
        const publicKeyObj = crypto.createPublicKey({
          key: Buffer.from(key.publicKey, 'base64'),
          format: 'der',
          type: 'spki',
        });
        const signatureBuffer = Buffer.from(proof.proofValue.slice(1), 'base58btc');
        checks.signature = crypto.verify(null, Buffer.from(hash), publicKeyObj, signatureBuffer);
        if (!checks.signature) errors.push('Presentation signature verification failed');
      } else {
        errors.push('Presentation verification key not found');
      }
    } catch (err) {
      errors.push(`Presentation verification error: ${err.message}`);
    }

    return {
      verified: errors.length === 0,
      checks,
      errors,
    };
  }
}
