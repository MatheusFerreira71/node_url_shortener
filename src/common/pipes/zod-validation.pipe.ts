import {
	type ArgumentMetadata,
	Injectable,
	type PipeTransform,
} from '@nestjs/common';
import type z from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
	constructor(private schema: z.ZodType) {}

	transform(value: unknown, _metadata: ArgumentMetadata) {
		const parsedValue = this.schema.parse(value);
		return parsedValue;
	}
}
