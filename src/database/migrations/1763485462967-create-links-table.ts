import {
	type MigrationInterface,
	type QueryRunner,
	Table,
	TableForeignKey,
} from 'typeorm';

export class CreateLinksTable1763485462967 implements MigrationInterface {
	private linksTable = new Table({
		name: 'links',
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
				name: 'original_url',
				type: 'text',
				isNullable: false,
			},
			{
				name: 'current_url',
				type: 'text',
				isNullable: false,
			},
			{
				name: 'hash',
				type: 'varchar',
				length: '6',
				isUnique: true,
				isNullable: false,
			},
			{
				name: 'times_clicked',
				type: 'bigint',
				default: 0,
				isNullable: false,
			},
			{
				name: 'user_id',
				type: 'uuid',
				isNullable: true,
			},
			{
				name: 'expires_at',
				type: 'timestamptz',
				isNullable: true,
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

	private foreignKey = new TableForeignKey({
		columnNames: ['user_id'],
		referencedTableName: 'users',
		referencedColumnNames: ['id'],
		onDelete: 'SET NULL',
		onUpdate: 'CASCADE',
	});

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.createTable(this.linksTable, true, false, true);

		await queryRunner.createForeignKey(this.linksTable, this.foreignKey);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.dropForeignKey(this.linksTable, this.foreignKey);

		await queryRunner.dropTable(this.linksTable, true, false, true);
	}
}
