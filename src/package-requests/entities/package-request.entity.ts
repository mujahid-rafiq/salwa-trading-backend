import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PackageRequestStatus } from '../../enums/package-request-status.enum';

@Entity({ name: 'package_requests' })
export class PackageRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: false, eager: true })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 100 })
  packageName!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 20 })
  profitRate!: string;

  @Column({ type: 'varchar', length: 20 })
  duration!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  transactionId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentScreenshotUrl?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({
    type: 'enum',
    enum: PackageRequestStatus,
    default: PackageRequestStatus.PENDING,
  })
  status!: PackageRequestStatus;

  @Column({ type: 'datetime', nullable: true })
  reviewedAt?: Date;

  @Column({ type: 'varchar', length: 150, nullable: true })
  reviewedBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
