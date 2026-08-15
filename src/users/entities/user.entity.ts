import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from '../../enums/role.enum';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  fullName?: string;

  @Column({
    type: 'varchar',
    length: 150,
    unique: true,
  })
  email!: string;

  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
  })
  phoneNumber!: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  password!: string;

  @Column({
    type: 'varchar',
    length: 6,
    nullable: true,
  })
  passwordResetCode: string | null = null;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  passwordResetExpiresAt: Date | null = null;

  @Column({
    type: 'varchar',
    length: 6,
    nullable: true,
  })
  emailVerificationCode: string | null = null;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  emailVerificationExpiresAt: Date | null = null;

  @Column({
    type: 'varchar',
    length: 20,
    default: Role.CLIENT,
  })
  role!: Role;

  @Column({
    type: 'boolean',
    default: false,
  })
  isVerified!: boolean;

  @Column({
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  profileImage?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'referred_by' })
  referredBy?: User;

}