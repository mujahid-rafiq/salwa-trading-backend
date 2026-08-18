import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WithdrawalStatus } from '../../enums/withdrawal-status.enum';

@Entity({ name: 'withdrawals' })
export class Withdrawal {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User)
  user!: User;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 20 })
  source!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  paymentMethod?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  bankName?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  iban?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  accountTitle?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mobileNumber?: string;

  @Column({ type: 'varchar', length: 20, default: WithdrawalStatus.PENDING })
  status!: WithdrawalStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  reviewedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
