import { access, readFile, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@hey-api/openapi-ts';
import { afterEach, describe, expect, it } from 'vitest';

import { defineConfig } from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const output = resolve(here, 'generated');

afterEach(() => rm(output, { force: true, recursive: true }));

describe('zod-operation-data', () => {
  it('generates a combined operation schema from HeyAPI Zod symbols', async () => {
    await createClient({
      input: resolve(here, 'fixtures/openapi.json'),
      logs: { level: 'silent' },
      output,
      plugins: [
        '@hey-api/typescript',
        {
          name: 'zod',
          requests: { shouldExtract: true },
          responses: true,
        },
        defineConfig(),
      ],
    });

    const generated = await readFile(resolve(output, 'zod.gen.ts'), 'utf8');

    expect(generated).toContain('export const zPostWidgetData = z.object({');
    expect(generated).toContain('body: zPostWidgetBody');
    expect(generated).toContain('path: zPostWidgetPath');
    expect(generated).toContain('query: zPostWidgetQuery');
    expect(generated).toContain('response: zPostWidgetResponse');
    expect(generated).toContain(
      'responses: z.custom<PostWidgetResponses & PostWidgetErrors>()',
    );
    await expect(
      access(resolve(output, 'zod-operation-data.gen.ts')),
    ).rejects.toThrow();
  });
});
