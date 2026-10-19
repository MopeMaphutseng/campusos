import { SetMetadata } from '@nestjs/common';

export const TARGETED_TYPE_KEY = 'targeted_content_type';

export type TargetedContentType =
  | 'library'
  | 'scholarship'
  | 'job'
  | 'research'
  | 'location'
  | 'news'
  | 'seminar'
  | 'mentor';

/**
 * Marks a GET list route whose array results should be filtered by the
 * requesting student's enrolled course codes. Unguarded behaviour: when no
 * content_targets row exists for an item, it is visible to everyone.
 */
export const TargetedType = (type: TargetedContentType) =>
  SetMetadata(TARGETED_TYPE_KEY, type);
