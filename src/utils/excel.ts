import Excel from 'exceljs';
import { existsSync } from 'fs';
import { TranslatedData } from '../types';

const getExcelHeaders = (locales: Set<string>) => {
  return [
    { header: 'id', key: 'id' },
    ...Array.from(locales.values())
      .sort((a: string, b: string) => b.localeCompare(a))
      .map(item => ({
        key: item,
        header: item,
        width: 50,
      })),
  ] as Excel.Column[];
};

export const mergePreviousExcelData = async (
  map: Map<string, TranslatedData>,
  previousFilename: string
) => {
  if (existsSync(previousFilename)) {
    const previousData = await readExcelData(previousFilename);

    for (const item of previousData.values()) {
      if (map.has(item.id)) {
        map.set(item.id, {
          ...item,
          ...map.get(item.id),
        });
      }
    }
  }

  const list = Array.from(map.values());

  return list.sort((a, b) => JSON.stringify(a).length - JSON.stringify(b).length);
};

export const mergeInternalTranslatedData = (
  map: Map<string, TranslatedData>,
  translatedDataFilename: string
) => {
  if (existsSync(translatedDataFilename)) {
    const data = require(translatedDataFilename) as Record<string, Record<string, string>>;

    Object.entries(data).forEach(([id, item]) => {
      if (map.has(id)) {
        map.set(id, {
          ...map.get(id)!,
          ...item,
        });
      }
    });
  }

  return map;
};

export const writeDataToExcel = async (
  locales: Set<string>,
  data: TranslatedData[],
  filename: string
) => {
  const book = new Excel.Workbook();
  const sheet = book.addWorksheet('data');

  sheet.columns = getExcelHeaders(locales);

  sheet.addRows(data);

  await book.xlsx.writeFile(filename);
};

export const readExcelData = async (filename: string) => {
  const book = new Excel.Workbook();
  await book.xlsx.readFile(filename);

  // @ts-ignore
  const map = new Map<string, TranslatedData>();
  const sheet = book.worksheets[0];

  if (sheet !== null && sheet.rowCount > 0) {
    const headers = (sheet.getRow(1).values as string[]).slice(1);

    sheet.eachRow((row, index) => {
      if (index === 1) {
        return;
      }

      const { values } = row;
      const item = (values as string[]).slice(1);

      map.set(item[0], {
        id: item[0],
        ...item.slice(1).reduce(
          (map, val, index) => ({
            ...map,
            [headers[index + 1]]: val.trim(),
          }),
          {}
        ),
      });
    });
  }

  return map;
};
