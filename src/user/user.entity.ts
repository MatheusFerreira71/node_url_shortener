import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../resources';

@Entity('users')
export class User extends BaseEntity {
	@Column('varchar', { length: 100, nullable: true })
	declare name: string;

	@Column('varchar', { length: 150, unique: true, nullable: false })
	declare email: string;

	@Column('varchar', { length: 200, nullable: false })
	declare password: string;
}
