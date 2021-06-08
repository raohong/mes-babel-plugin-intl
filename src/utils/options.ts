import * as p from 'path';
import { existsSync, readFileSync } from 'fs';
import { ScanConfigFilename } from '../config';
import { ScanOptions } from '../types';

export const getScanOptions = (root: string): ScanOptions => {
  const options = {} as ScanOptions;
  const name = p.join(root, ScanConfigFilename);

  if (existsSync(name)) {
    Object.assign(options, JSON.parse(readFileSync(name).toString()));
  }

  return options;
};

export const defaultScanConvertor: ScanOptions['convertor'] = data => {
  return Array.from(data.entries()).reduce(
    (list, [key, item]) =>
      list.concat({
        id: key,
        defaultMessage: item.defaultMessage,
        description: item.description,
      }),
    [] as any[]
  );
};

export const getTranslatedDir = (root: string) => {
  const filename = p.join(root, 'l10n.config.js');
  const content = existsSync(filename) ? require(filename) : null;

  const defaultDir = 'locales';

  let ret;

  if (!content) {
    ret = defaultDir;
    return p.join(root, ret);
  }

  try {
    const obj = content.middlewares;
    const match = obj.emit.match(/\?dest=([^?]+)/);
    ret = match ? match[1] : defaultDir;
  } catch (_) {
    ret = defaultDir;
  }
  return p.join(root, ret);
};
