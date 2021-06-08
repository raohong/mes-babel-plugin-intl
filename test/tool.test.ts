import rimraf from 'rimraf';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';

const root = dirname(__dirname);

const execCommand = (command: string) => execSync(`node ./bin/index.js ${command}`).toString();

describe('Tool', () => {
  it('生成 ID', () => {
    const id = execCommand('id -m 测试');
    const scoped = execCommand('id -m 测试 -s school');

    expect(id).toBeTruthy();
    expect(id === scoped).toBeFalsy();
  });

  it('提取 messages', () => {
    const scanDist = join(root, 'i18n-messages');

    execCommand(`scan -s ./test/babel`);

    expect(existsSync(join(scanDist, 'data.json'))).toBeTruthy();
    expect(rimraf.sync(scanDist)).toBeUndefined();
  });

  it('提取 messages, 自定义路径', () => {
    const scanDistFilename = join(root, 'test', 'scan-dist', 'data.json');

    execCommand(`scan -s ./test/babel -d ./test/scan-dist/data.json`);

    expect(existsSync(scanDistFilename)).toBeTruthy();

    expect(JSON.parse(readFileSync(scanDistFilename).toString()).length).toBeGreaterThan(0);
    expect(rimraf.sync(dirname(scanDistFilename))).toBeUndefined();
  });

  it('测试 transform', () => {
    const dist = join(root, 'test', '.transform-dist');

    execCommand(`scan -s ./test/babel -d ${join(dist, 'data.json')}`);
    execCommand(`transform -s ${join(dist, 'data.json')} -d ${join(dist, 'dist.xlsx')}`);

    expect(existsSync(join(dist, 'dist.xlsx'))).toBeTruthy();
    expect(rimraf.sync(dist)).toBeUndefined();
  });

  it('测试 pick', () => {
    execCommand(`scan -s ./test/babel`);
    execCommand(`t`);
    execCommand(`pick`);

    expect(rimraf.sync(join(root, 'locales'))).toBeUndefined();
    expect(rimraf.sync(join(root, 'i18n-messages'))).toBeUndefined();
  });
});
