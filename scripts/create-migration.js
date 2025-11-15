#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const migrationName = process.argv[2];

if (!migrationName) {
	console.error('❌ Erro: Nome da migration não fornecido');
	console.log('Uso: pnpm migration:create <nome-da-migration>');
	console.log('Exemplo: pnpm migration:create add-table');
	process.exit(1);
}

const migrationPath = path.join('src', 'database', 'migrations', migrationName);

try {
	execSync(`typeorm migration:create ${migrationPath}`, {
		stdio: 'inherit',
		shell: true,
	});
} catch {
	process.exit(1);
}
