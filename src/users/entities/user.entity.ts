import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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
    length: 20,
    default: 'user',
  })
  role!: string;

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
}