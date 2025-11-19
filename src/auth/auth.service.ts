import { Injectable } from '@nestjs/common';
import type { LoginDto, LoginResponse } from './auth.types';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa usar isso na injeção de dependência
import { LoginUsecase } from './usecases';

@Injectable()
export class AuthService {
	constructor(private loginUsecase: LoginUsecase) {}

	async login(dto: LoginDto): Promise<LoginResponse> {
		return this.loginUsecase.execute(dto);
	}
}
