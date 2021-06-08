import * as p from 'path';
import { transformSync } from '@babel/core';
import plugin from '../src/plugin';
import genId from '../src/utils/id';
import { PluginOptions } from '../src/types';
import { getFileContent } from './util';

const target = p.join(__dirname, 'babel');

const render = (filename: string, options?: PluginOptions) => {
  const content = getFileContent(filename);
  const result = transformSync(content, {
    presets: ['@babel/preset-react', '@babel/preset-typescript'],
    filename,
    plugins: [
      [
        plugin,
        {
          ...options,
        },
      ],
    ],
  });

  const code = result?.code || '';

  return code;
};

describe('Babel Plugin', () => {
  it('默认配置 Babel 插件', () => {
    const code = render(p.join(target, 'normal.tsx'));

    expect(code.length).toBeGreaterThan(0);

    const shortcuts = ['测试', '已选择 {total} 项'];
    const formatMessages = ['默认 formatMessage', '当前数量 : {total}'];
    const formattedMessages = ['测试 FormattedMessage', '渲染 {total} FormattedMessage'];

    expect(code.length).toBeGreaterThan(0);

    shortcuts.forEach(item => {
      expect(code.includes(genId(item))).toBeTruthy();
    });

    formatMessages.forEach(item => {
      expect(code.includes(genId(item))).toBeTruthy();
    });

    formattedMessages.forEach(item => {
      expect(code.includes(genId(item))).toBeTruthy();
    });
  });

  it('额外的组件', () => {
    const code = render(p.join(target, 'additionalHtml.tsx'), {
      componentNames: ['FormattedHtmlMessage'],
    });

    expect(code.length).toBeGreaterThan(0);

    const formattedMessages = ['测试 FormattedHtmlMessage', '渲染 {total} FormattedHtmlMessage'];

    formattedMessages.forEach(item => {
      expect(code.includes(genId(item))).toBeTruthy();
    });
  });

  it('额外的函数', () => {
    const code = render(p.join(target, 'additionalFunction.tsx'), {
      functionNames: ['fake'],
    });

    expect(code.length).toBeGreaterThan(0);

    const formattedMessages = ['默认 formatMessage', '当前数量 : {total}'];

    formattedMessages.forEach(item => {
      expect(code.includes(genId(item))).toBeTruthy();
    });
  });

  it('移除 defaultMessage', () => {
    const code1 = render(p.join(target, 'additionalFunction.tsx'), {
      functionNames: ['fake'],
      removeDefaultMessage: true,
    });
    const code2 = render(p.join(target, 'additionalFunction.tsx'), {
      functionNames: ['fake'],
    });

    expect(code1.includes('{total}')).toBeFalsy();
    expect(code2.includes('{total}')).toBeTruthy();
  });
});
