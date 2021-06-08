import { join } from 'path';
import { Service } from 'umi';
import { readFileSync } from 'fs';
import { id } from '../src';

const cwd = join(__dirname, './fixtures');
const pkg = require('../package.json');

jest.setTimeout(1000 * 60);

test('Umi Plugin', async () => {
  const service = new Service({
    cwd,
    pkg,
    plugins: [require.resolve('../src')],
  });

  await service.run({
    name: 'build',
  });

  const content = readFileSync(join(cwd, 'dist', 'umi.js')).toString();

  expect(content.includes(id('测试')));
  expect(content.includes(id('发送', 'offer')));
});
