import { SetMetadata } from '@nestjs/common';

export const IS_MASTER_KEY = 'isMaster';
export const IsMaster = () => SetMetadata(IS_MASTER_KEY, true);
