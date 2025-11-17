import { type MigrationInterface, type QueryRunner, Table } from 'typeorm';

export class CreateUserTable1763305874395 implements MigrationInterface {
	private userTable = new Table({
		name: 'users',
		schema: 'public',
		columns: [
			{
				name: 'id',
				type: 'uuid',
				isPrimary: true,
				generationStrategy: 'uuid',
				default: 'uuid_generate_v4()',
			},
			{
				name: 'name',
				type: 'varchar',
				length: '100',
				isNullable: true,
			},
			{
				name: 'email',
				type: 'varchar',
				length: '150',
				isUnique: true,
			},
			{
				name: 'password',
				type: 'varchar',
				length: '200',
			},
			{
				name: 'created_at',
				type: 'timestamptz',
				default: 'CURRENT_TIMESTAMP',
			},
			{
				name: 'updated_at',
				type: 'timestamptz',
				default: 'CURRENT_TIMESTAMP',
			},
			{
				name: 'deleted_at',
				type: 'timestamptz',
				isNullable: true,
			},
		],
	});

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

		await queryRunner.createTable(this.userTable, true, false, true);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.dropTable(this.userTable, true, true, true);
	}
}
