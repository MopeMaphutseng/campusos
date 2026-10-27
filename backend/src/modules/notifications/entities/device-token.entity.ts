import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';
import { PushPlatform } from '../services/push-provider.interface';

export { PushPlatform };

@Entity('device_tokens')
@Index(['universityId', 'userId'])
@Index(['token'], { unique: true })
export class DeviceToken extends TenantBaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 512, unique: true })
  token: string;

  @Column({ type: 'enum', enum: PushPlatform, default: PushPlatform.WEB })
  platform: PushPlatform;

  @Column({ type: 'timestamp', name: 'last_used_at', default: () => 'NOW()' })
  lastUsedAt: Date;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;
}
