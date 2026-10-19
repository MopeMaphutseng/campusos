import * as crypto from 'crypto';
import { SigningKey } from './credential-types';

export class DidService {
  private keyStore = new Map<string, SigningKey>();

  createWebDid(universitySlug: string): { did: string; document: any } {
    const did = `did:web:${universitySlug}.campusos.com`;
    const keyPair = this.generateEd25519KeyPair();
    const keyId = `${did}#key-1`;

    const document = {
      '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/ed25519-2020/v1'],
      id: did,
      verificationMethod: [{
        id: keyId,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase: keyPair.publicKeyMultibase,
      }],
      authentication: [keyId],
      assertionMethod: [keyId],
      created: new Date().toISOString(),
    };

    this.keyStore.set(keyId, {
      id: keyId,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      algorithm: 'Ed25519',
      created: new Date(),
      active: true,
    });

    return { did, document };
  }

  createUserDid(userId: string, universitySlug: string): { did: string; document: any } {
    const did = `did:key:${userId}`;
    const keyPair = this.generateEd25519KeyPair();
    const keyId = `${did}#key-1`;

    const document = {
      '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/ed25519-2020/v1'],
      id: did,
      verificationMethod: [{
        id: keyId,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase: keyPair.publicKeyMultibase,
      }],
      authentication: [keyId],
      created: new Date().toISOString(),
    };

    this.keyStore.set(keyId, {
      id: keyId,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      algorithm: 'Ed25519',
      created: new Date(),
      active: true,
    });

    return { did, document };
  }

  resolveDid(did: string): any | null {
    if (did.startsWith('did:key:')) {
      const keyId = `${did}#key-1`;
      const key = this.keyStore.get(keyId);
      if (!key) return null;
      return {
        '@context': ['https://www.w3.org/ns/did/v1'],
        id: did,
        verificationMethod: [{
          id: keyId,
          type: 'Ed25519VerificationKey2020',
          controller: did,
        }],
        authentication: [keyId],
      };
    }

    if (did.startsWith('did:web:')) {
      return {
        '@context': ['https://www.w3.org/ns/did/v1'],
        id: did,
        verificationMethod: [],
        authentication: [],
      };
    }

    return null;
  }

  getKeyById(keyId: string): SigningKey | undefined {
    return this.keyStore.get(keyId);
  }

  getActiveKeyForIssuer(issuerDid: string): SigningKey | undefined {
    for (const [id, key] of this.keyStore) {
      if (id.startsWith(issuerDid) && key.active) return key;
    }
    return undefined;
  }

  rotateKey(issuerDid: string): SigningKey {
    const oldKey = this.getActiveKeyForIssuer(issuerDid);
    if (oldKey) {
      oldKey.active = false;
      oldKey.rotatedAt = new Date();
    }

    const keyPair = this.generateEd25519KeyPair();
    const keyId = `${issuerDid}#key-${Date.now()}`;
    const newKey: SigningKey = {
      id: keyId,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      algorithm: 'Ed25519',
      created: new Date(),
      active: true,
    };

    this.keyStore.set(keyId, newKey);
    return newKey;
  }

  private generateEd25519KeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    const pubDER = publicKey.export({ type: 'spki', format: 'der' });
    const privDER = privateKey.export({ type: 'pkcs8', format: 'der' });
    return {
      publicKey: pubDER.toString('base64'),
      privateKey: privDER.toString('base64'),
      publicKeyMultibase: `z${Buffer.from(pubDER).toString('base58btc')}`,
    };
  }
}
