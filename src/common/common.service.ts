import {
	createCipheriv,
	createDecipheriv,
	randomBytes,
	scrypt,
} from 'node:crypto';
import { promisify } from 'node:util';
import { Injectable } from '@nestjs/common';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa usar isso na injeção de dependência
import { ConfigService } from '@nestjs/config';
import type { Env } from '../schemas';

@Injectable()
export class CommonService {
	private secretKey: string;

	constructor(private configService: ConfigService<Env, true>) {
		this.secretKey = this.configService.get('HASH_SECRET_KEY', {
			infer: true,
		});
	}

	private readonly scryptAsync = promisify(scrypt);

	/**
	 * Algoritmo de criptografia utilizado para hash e decodificação
	 * @private {string}
	 */
	private readonly ALGORITHM = 'aes-256-cbc';

	/**
	 * Tamanho do vetor de inicialização (IV) em bytes
	 * @private {number}
	 */
	private readonly IV_LENGTH = 16;

	/**
	 * Tamanho do salt em bytes
	 * @private {number}
	 */
	private readonly SALT_LENGTH = 16;

	/**
	 * Criptografa uma string usando AES-256-CBC
	 * @param {string} input - A string a ser criptografada
	 * @returns {Promise<string>} Uma promise que resolve para a string criptografada no formato 'iv:encrypted'
	 * @example
	 * const encrypted = await hash('minha-senha');
	 * console.log(encrypted); // '1a2b3c4d...:5e6f7g8h...'
	 */
	async hash(input: string): Promise<string> {
		const iv = randomBytes(this.IV_LENGTH);
		const salt = randomBytes(this.SALT_LENGTH);

		const key = (await this.scryptAsync(this.secretKey, salt, 32)) as Buffer;
		const cipher = createCipheriv(this.ALGORITHM, key, iv);

		const encrypted = Buffer.concat([
			Buffer.from(cipher.update(input, 'utf-8', 'hex'), 'hex'),
			Buffer.from(cipher.final('hex'), 'hex'),
		]);

		return Buffer.concat([salt, iv, encrypted]).toString('hex');
	}

	/**
	 * Descriptografa uma string criptografada usando AES-256-CBC
	 * @param {string} encrypted - A string criptografada no formato 'iv:encrypted'
	 * @returns {Promise<string>} Uma promise que resolve para a string descriptografada original
	 * @throws {Error} Lança erro se o formato da string criptografada for inválido
	 * @example
	 * const decrypted = await decodeHash('1a2b3c4d...:5e6f7g8h...');
	 * console.log(decrypted); // 'minha-senha'
	 */
	async decodeHash(encrypted: string): Promise<string> {
		const data = Buffer.from(encrypted, 'hex');

		const salt = data.subarray(0, 16);
		const iv = data.subarray(16, 32);
		const encryptedText = data.subarray(32).toString('hex');

		const key = (await this.scryptAsync(this.secretKey, salt, 32)) as Buffer;
		const decipher = createDecipheriv(this.ALGORITHM, key, iv);

		const decrypted = Buffer.concat([
			Buffer.from(decipher.update(encryptedText, 'hex', 'utf-8'), 'utf-8'),
			Buffer.from(decipher.final('utf-8'), 'utf-8'),
		]);

		return decrypted.toString('utf-8');
	}
}
