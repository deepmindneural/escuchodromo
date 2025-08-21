import { SetMetadata } from '@nestjs/common';

export const CLAVE_ROLES = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(CLAVE_ROLES, roles);