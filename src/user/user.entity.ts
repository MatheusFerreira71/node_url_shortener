import { Column, Entity, OneToMany } from 'typeorm';
import { Link } from '../link/link.entity';
import { BaseEntity } from '../resources';

@Entity('users')
export class User extends BaseEntity {
	@Column('varchar', { length: 100, nullable: true })
	declare name: string | null;

	@Column('varchar', { length: 150, unique: true, nullable: false })
	declare email: string;

	@Column('varchar', { length: 200, nullable: false })
	declare password: string;

	@OneToMany(
		() => Link,
		(link) => link.user,
	)
	declare links: Link[];
}
