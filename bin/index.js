#!/usr/bin/env node

const program = require('commander');
const { scan, transform, distribute, pickL18nMessages, translate, id } = require('../dist');

/**
 * 扫描目标文件 提取待翻译信息
 */
program
  .command('scan')
  .option('-s, --source <source>', 'source files')
  .option('-d, --dist <dist>', 'dist file')
  .action(async ({ source, dist }) => {
    await scan(process.cwd(), source, dist);
  });

/**
 * 将 l10n  翻译后的数据提取到 excel 文件
 */
program
  .command('pick')
  .option('-s, --source <source>', 'source dir')
  .option('-d, --dist <dist>', 'dist file')
  .action(async ({ dist, source }) => {
    await pickL18nMessages(process.cwd(), source, dist);
  });

/**
 * 将扫描得到的数据转成 Excel
 */
program
  .command('transform')
  .option('-d, --dist <dist>', 'dist file')
  .option('-s, --source <source>', 'source file')
  .option('-l, --locale <dist>', 'default locale')
  .action(async ({ source, locale, dist }) => {
    await transform(process.cwd(), source, dist, locale);
  });

/**
 * 将 Excel 数据写入到 locales
 */
program
  .command('distribute')
  .option('-d, --dist <dist>', 'dist dir')
  .action(async ({ dist }) => {
    await distribute(process.cwd(), dist);
  });

/**
 * 生成 id
 */
program
  .command('id')
  .option('-m, --message [message]', 'message')
  .option('-s, --scope <scope>', 'scope')
  .action(({ message, scope }) => {
    console.log(id(message, scope));
  });

/**
 * 调用 l10n 翻译
 */
program.command('t').action(() => {
  translate(process.cwd());
});

async function main() {
  await program.parseAsync(process.argv);
}

main();
