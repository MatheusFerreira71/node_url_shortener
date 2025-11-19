import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../resources';
import { User } from '../user/user.entity';

@Entity('links')
export class Link extends BaseEntity {
	@Column('text', { nullable: false })
	declare original_url: string;

	@Column('text', { nullable: false })
	declare current_url: string;

	@Column('varchar', { length: 6, unique: true, nullable: false })
	declare hash: string;

	@Column('bigint', { default: 0, nullable: false })
	declare times_clicked: number;

	@Column('uuid', { nullable: true })
	declare user_id: string | null;

	@Column('timestamptz', { nullable: true })
	declare expires_at: Date | null;

	@ManyToOne(
		() => User,
		(user) => user.links,
		{ nullable: true },
	)
	@JoinColumn({
		name: 'user_id',
		referencedColumnName: 'id',
	})
	declare user: User | null;
}
