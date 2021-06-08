import * as p from 'path';
import * as mkdirp from 'mkdirp';
import { promises, existsSync, writeFileSync } from 'fs';
import { readExcelData } from '../utils/excel';
import { getTranslatedDir } from '../utils/options';
import { DistributionName, ExcelFilename } from '../config';

const insertImport = async (filename: string, locale: string, name: string) => {
  let content = await (await promises.readFile(filename)).toString();

  if (content && !content.includes(name)) {
    content = content.replace(/\s*export\s+default/, match => {
      return content.includes(name)
        ? match
        : `\nimport ${name} from "./${locale}/${name}";${match}`;
    });

    content = content.replace(
      /(,)?(\s*};?\s*$)/,
      (_, $1, $2) => `${$1 || ','}\n  ...${name},${$2}`
    );
  } else if (!content) {
    content = `import ${name} from "./${locale}/${name}";

export default {
  ... ${name}
};
    `;
  }

  await promises.writeFile(filename, content);
};

/**
 * 将 Excel 文件里的翻译数据分发到代码里
 *
 * @param root 根目录
 * @param dist 目标路径 , 参照 umi locales
 * @param excel Excel 文件
 */
const distribute = async (root: string, dist = 'src/locales', excel = ExcelFilename) => {
  const sourceDir = getTranslatedDir(root);
  const distDir = p.isAbsolute(dist) ? dist : p.join(root, dist);
  const excelFilename = p.join(sourceDir, excel);
  const data = await readExcelData(excelFilename);

  if (data.size === 0) {
    return;
  }

  const list = Array.from(data.values());
  const keys = list.map(Object.keys).sort((a, b) => b.length - a.length);
  const locales = keys[0].filter(item => item !== 'id');
  const dirs = locales.map(locale => p.join(distDir, locale));

  const collections = locales.map(locale => ({
    locale,
    data: list.reduce(
      (map, item) => ({
        ...map,
        [item.id]: item[locale],
      }),
      {}
    ),
  }));

  dirs.map(mkdirp.sync);

  dirs.forEach(dir => {
    mkdirp.sync(dir);

    if (!existsSync(`${dir}.ts`)) {
      writeFileSync(`${dir}.ts`, '');
    }
  });

  await Promise.all(
    collections.map(async ({ locale, data }) => {
      const content = `export default ${JSON.stringify(data, null, 2)};`;

      const targetFilename = p.join(distDir, locale, `${DistributionName}.ts`);

      await Promise.all([
        promises.writeFile(targetFilename, content),
        insertImport(p.join(distDir, `${locale}.ts`), locale, DistributionName),
      ]);
    })
  );
};

export default distribute;
