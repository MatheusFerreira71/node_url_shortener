import { z } from 'zod';
import { pt } from 'zod/locales';

export const configureZod = () => z.config(pt());
