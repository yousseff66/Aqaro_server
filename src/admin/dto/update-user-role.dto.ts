import { IsIn } from 'class-validator';

export class UpdateUserRoleDto {
  @IsIn(['User', 'Admin'])
  role!: string;
}
