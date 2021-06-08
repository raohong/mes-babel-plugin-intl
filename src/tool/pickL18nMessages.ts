import glob from 'glob';
import * as p from 'path';
import { promisify } from 'util';
import { promises } from 'fs';
import {
  ExcelFilename,
  LocaleMap,
  InternalTranslatedDataFilename,
  I18nMessageFilename,
} from '../config';
import {
  mergeInternalTranslatedData,
  mergePreviousExcelData,
  writeDataToExcel,
} from '../utils/excel';
import { getTranslatedDir } from '../utils/options';
import { TranslatedData } from '../types';

const globASync = promisify(glob);

const readData = async (file: string) => {
  const content = await (await promises.readFile(file)).toString();
  const locale = p.basename(file, p.extname(file));

  const list = Object.entries(JSON.parse(content) as Record<string, string>).reduce(
    (ret, [id, defaultMessage]) =>
      ret.concat({
        id,
        defaultMessage,
      }),
    [] as { id: string; defaultMessage: string }[]
  );

  return {
    locale,
    list,
  };
};

/**
 * 将翻译后的数据 提取到 excel,如果在目录下存在 excel , 则合并
 *
 * @param root 根目录
 * @param source 目标目录
 * @param dist 输出 Excel 文件名
 */
const pickL18nMessages = async (
  root: string,
  source: string = p.dirname(I18nMessageFilename),
  dist = ExcelFilename
) => {
  const sourceDir = getTranslatedDir(root);
  const files = await globASync(`${sourceDir}/*.json`);
  const distFilename = p.isAbsolute(dist) ? dist : p.join(sourceDir, dist);
  const internalTranslatedDataFilename = p.join(
    p.isAbsolute(source) ? source : p.join(root, source),
    InternalTranslatedDataFilename
  );

  const data = await Promise.all(files.map(file => readData(file)));

  const map = new Map<string, TranslatedData>();
  const locales = new Set<string>();

  data.forEach(({ locale, list }) => {
    const realLocale = locale in LocaleMap ? LocaleMap[locale as keyof typeof LocaleMap] : locale;

    locales.add(realLocale);

    list.forEach(item => {
      if (!map.has(item.id)) {
        map.set(item.id, {
          id: item.id,
        });
      }

      const target = map.get(item.id)!;

      map.set(item.id, {
        ...target,
        [realLocale]: item.defaultMessage,
      });
    });
  });

  const list = await mergePreviousExcelData(
    mergeInternalTranslatedData(map, internalTranslatedDataFilename),
    distFilename
  );

  await writeDataToExcel(locales, list, distFilename);
};

export default pickL18nMessages;
