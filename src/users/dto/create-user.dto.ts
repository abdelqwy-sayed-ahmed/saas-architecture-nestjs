import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CREATEUSERDTO {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}
