import glob from 'glob';
import * as p from 'path';
import * as mkdirp from 'mkdirp';
import { writeFileSync } from 'fs';
import { promisify } from 'util';
import { PluginObj, transformFileAsync } from '@babel/core';
import { ScanOptions, MessageDescriptor } from '../types';
import run from '../run';
import { I18nMessageFilename, InternalTranslatedDataFilename } from '../config';
import { defaultScanConvertor, getScanOptions } from '../utils/options';

const globASync = promisify(glob);

const runPlguin = async (file: string, plugin: () => PluginObj) => {
  await transformFileAsync(file, {
    presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-proposal-class-properties'],
      '@babel/plugin-syntax-dynamic-import',
      plugin,
    ],
  });
};

const pattern = /[a-z]{2}(?:-[A-Z]{2})?/;
const keysMap = new Map(
  ['id', 'defaultMessage', 'filename', 'loc', 'translatedMessage'].map(item => [item, item])
);

/**
 * 从列表中查找最合适的 descriptor
 * 含有翻译信息最多，如果一样但是内容不一样，给出警告
 * @param list
 */
const findDescriptor = (list: MessageDescriptor[]) => {
  const locales = list.map(item => {
    return Object.keys(item).filter(key => !keysMap.has(key) && pattern.test(key));
  });

  const max = Math.max(...locales.map(item => item.length));
  const items: MessageDescriptor[] = [];

  locales.forEach((item, index) => {
    if (item.length === max) {
      items.push(list[index]);
    }
  });

  if (max === 0 || items.length === 1) {
    const target = items.find(item => item.translatedMessage) ?? items[0];

    return target;
  }

  console.warn('存在相同翻译元素但翻译内容不一样:');

  throw Error(JSON.stringify(items, null, 2));
};

/**
 * 提取翻译数据
 *
 * @param root 艮目录
 * @param source 待提取的文件
 * @param dist 输出文件名
 */
const scan = async (root: string, source: string = 'src', dist: string = I18nMessageFilename) => {
  const options: ScanOptions = {
    source: p.isAbsolute(source) ? source : p.join(root, source),
    dist: p.isAbsolute(dist) ? dist : p.join(root, dist),
    convertor: defaultScanConvertor,
    ...getScanOptions(root),
  };

  const internalTranslatedDataFilename = p.join(
    p.dirname(options.dist!),
    InternalTranslatedDataFilename
  );

  const data = new Map<string, Map<string, MessageDescriptor[]>>();

  const runScan = () => {
    return run(false, options, data);
  };

  mkdirp.sync(p.dirname(options.dist!));
  const files = await globASync(`${options.source}/**/!(*.d).@(js|jsx|ts|tsx)`);

  await Promise.all(files.map(file => runPlguin(file, runScan)));

  const result = new Map<string, MessageDescriptor>();
  const translatedData = {} as Record<string, Record<string, string>>;

  for (const source of data.values()) {
    for (const item of source.values()) {
      const descriptor = findDescriptor(item);

      result.set(descriptor.id, descriptor);

      if (descriptor.translatedMessage) {
        translatedData[descriptor.id] = descriptor.translatedMessage;
      }
    }
  }

  if (Object.keys(translatedData).length) {
    writeFileSync(
      internalTranslatedDataFilename,
      `module.exports = ${JSON.stringify(translatedData)};`
    );
  }

  writeFileSync(options.dist!, JSON.stringify(options.convertor!(result)));
};

export default scan;
