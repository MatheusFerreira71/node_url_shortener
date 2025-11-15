import {
	CreateDateColumn,
	DeleteDateColumn,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
	@PrimaryGeneratedColumn('uuid')
	declare id: string;

	@CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	declare created_at: Date;

	@UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	declare updated_at: Date;

	@DeleteDateColumn({ type: 'timestamptz', nullable: true })
	declare deleted_at?: Date | null;
}
