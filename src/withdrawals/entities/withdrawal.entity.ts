import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WithdrawalStatus } from 'src/enums/withdrawal-status.enum';
// import { WithdrawalStatus } from '../../enums/withdrawal-status.enum';

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

  @Column({ type: 'varchar', length: 20, default: WithdrawalStatus.PENDING })
  status!: WithdrawalStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
