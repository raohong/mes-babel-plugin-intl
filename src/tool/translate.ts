import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 使用 atool-ll10n 翻译
 */
export default async (root: string) => {
  await execAsync('npx atool-l10n', { cwd: root });
};
