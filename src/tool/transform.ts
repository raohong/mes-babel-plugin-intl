import * as p from 'path';
import * as mkdirp from 'mkdirp';
import { readFileSync } from 'fs';
import {
  ExcelFilename,
  I18nMessageFilename,
  InternalTranslatedDataFilename,
  LocaleMap,
} from '../config';
import {
  mergeInternalTranslatedData,
  mergePreviousExcelData,
  writeDataToExcel,
} from '../utils/excel';
import { TranslatedData } from '../types';
import { getTranslatedDir } from '../utils/options';

/**
 * 将自动提取到的数据 提取到 excel,如果在目录下存在 excel , 则合并
 *
 * @param root  根目录
 * @param source  目标路径
 * @param locale 默认语言
 */
const transform = async (
  root: string,
  source: string = I18nMessageFilename,
  excelFilename: string = ExcelFilename,
  locale = 'zh-CN'
) => {
  source = p.isAbsolute(source) ? source : p.join(root, source);

  const l18nSourceDir = getTranslatedDir(root);
  const content = JSON.parse(readFileSync(source).toString()) as Array<{
    id: string;
    defaultMessage: string;
  }>;
  const internalTranslatedDataFilename = p.join(p.dirname(source), InternalTranslatedDataFilename);

  const distFilename = p.isAbsolute(excelFilename)
    ? excelFilename
    : p.join(l18nSourceDir, ExcelFilename);
  const map = new Map<string, TranslatedData>();
  const locales = new Set<string>(Object.values(LocaleMap));

  if (!p.isAbsolute(excelFilename)) {
    mkdirp.sync(l18nSourceDir);
  }

  content.forEach(item => {
    map.set(item.id, {
      id: item.id,
      [locale]: item.defaultMessage,
    });
  });

  mergeInternalTranslatedData(map, internalTranslatedDataFilename);

  const list = await mergePreviousExcelData(map, distFilename);

  await writeDataToExcel(locales, list, distFilename);
};

export default transform;
