#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const PROC_DIR = 'apps/api/src/modules/queue/processors';

const processors = [
  {
    file: 'email.processor.ts',
    prefix: 'email',
    mainMethod: 'sendEmail',
    arg: '_data: EmailJobData',
    successLog: 'muvaffaqiyatli bajarildi',
    stub: 'this.logger.debug(`[email] Xabar yuborilmoqda: ${JSON.stringify(_data.to)}`);',
  },
  {
    file: 'forecast-recalc.processor.ts',
    prefix: 'forecast',
    mainMethod: 'recalcForecast',
    arg: '_data: ForecastRecalcJobData',
    successLog: 'bashorat qayta hisoblandi',
    stub: 'this.logger.debug(`[forecast] Model ${_data.modelId} qayta hisoblanmoqda`);',
  },
  {
    file: 'label-print.processor.ts',
    prefix: 'label',
    mainMethod: 'printLabels',
    arg: '_data: LabelPrintJobData',
    successLog: 'muvaffaqiyatli bajarildi',
    stub: 'this.logger.debug(`[label] Printer ${_data.printerId} ga ${_data.items.length} ta yorliq yuborilmoqda`);',
  },
  {
    file: 'mrp-run.processor.ts',
    prefix: 'mrp',
    mainMethod: 'runMrp',
    arg: '_data: MrpRunJobData',
    successLog: 'MRP muvaffaqiyatli bajarildi',
    stub: 'this.logger.debug(`[mrp] MRP hisoblash ishga tushirildi: horizon=${_data.planningHorizonDays}d`);',
  },
  {
    file: 'pdf-generation.processor.ts',
    prefix: 'pdf',
    mainMethod: 'generatePdf',
    arg: '_data: PdfJobData',
    successLog: 'muvaffaqiyatli bajarildi',
    stub: 'this.logger.debug(`[pdf] Shablon ${_data.templateName} asosida PDF yaratilmoqda`);',
  },
  {
    file: 'telegram.processor.ts',
    prefix: 'telegram',
    mainMethod: 'sendTelegramMessage',
    arg: '_data: TelegramJobData',
    successLog: 'muvaffaqiyatli bajarildi',
    stub: 'this.logger.debug(`[telegram] ChatId ${_data.chatId} ga xabar yuborilmoqda`);',
  },
];

for (const proc of processors) {
  const filePath = `${PROC_DIR}/${proc.file}`;
  let content = readFileSync(filePath, 'utf8');

  // 1. Remove TODO/Example comment lines
  content = content.replace(/\s*\/\/ TODO:.*\n/g, '\n');
  content = content.replace(/\s*\/\/ Example:.*\n/g, '\n');

  // 2. Wrap awaited call in try/catch
  // Find: `await this.X(data);\n    this.logger.log(...);`
  // and add try/catch around it
  const awaitLine = `    await this.${proc.mainMethod}(job.data);`;
  const logLineRe = new RegExp(`(    await this\\.${proc.mainMethod}\\(job\\.data\\);\\n    this\\.logger\\.log\\(\\\`\\[${proc.prefix}\\] Job #\\$\\{job\\.id\\} ${proc.successLog.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\\`\\);)`);
  content = content.replace(logLineRe, (match) => {
    return `    try {\n  ${match.split('\n').join('\n  ')}\n    } catch (err) {\n      this.logger.error(\`[${proc.prefix}] Job #\${job.id} xato: \${(err as Error).message}\`);\n      throw err;\n    }`;
  });

  // 3. Replace empty private method body with stub
  const emptyMethodRe = new RegExp(
    `(private async ${proc.mainMethod}\\(${proc.arg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\): Promise<void> \\{)\\s*(\\})`
  );
  content = content.replace(emptyMethodRe, `$1\n    ${proc.stub}\n  $2`);

  writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed: ${proc.file}`);
}
