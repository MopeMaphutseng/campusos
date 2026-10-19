import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum UniversityStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  ONBOARDING = 'onboarding',
  TRIAL = 'trial',
}

@Entity('universities')
export class University extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  domain: string;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'country_code' })
  countryCode: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'text', nullable: true, name: 'logo_url' })
  logoUrl: string;

  @Column({ type: 'text', nullable: true, name: 'cover_image_url' })
  coverImageUrl: string;

  @Column({
    type: 'enum',
    enum: UniversityStatus,
    default: UniversityStatus.ONBOARDING,
  })
  status: UniversityStatus;

  @Column({ type: 'jsonb', default: () => "'{}'", name: 'branding' })
  branding: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    customDomain?: string;
  };

  @Column({ type: 'jsonb', default: () => "'{}'", name: 'sso_config' })
  ssoConfig: {
    provider?: 'saml' | 'oidc' | 'custom';
    entryPoint?: string;
    issuer?: string;
    callbackUrl?: string;
    cert?: string;
    metadataUrl?: string;
  };

  @Column({ type: 'jsonb', default: () => "'{}'", name: 'feature_flags' })
  featureFlags: Record<string, boolean>;

  @Column({ type: 'varchar', length: 50, default: 'free', name: 'subscription_tier' })
  subscriptionTier: string;

  @Column({ type: 'varchar', length: 20, default: 'en', name: 'default_language' })
  defaultLanguage: string;

  @Column({ type: 'varchar', length: 50, default: 'UTC' })
  timezone: string;

  @OneToMany('User', 'university')
  users: any[];

  @OneToMany('UniversityModule', 'university')
  modules: any[];
}
