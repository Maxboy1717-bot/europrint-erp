const ts = require('typescript');

const TSCONFIG = {
  experimentalDecorators: true,
  emitDecoratorMetadata: true,
  target: ts.ScriptTarget.ES2021,
  module: ts.ModuleKind.CommonJS,
  allowSyntheticDefaultImports: true,
  esModuleInterop: true,
  sourceMap: true,
  inlineSources: true,
  skipLibCheck: true,
  removeComments: false,
};

module.exports = {
  process(sourceText, sourcePath) {
    if (!sourcePath.endsWith('.ts') && !sourcePath.endsWith('.tsx')) {
      return { code: sourceText };
    }
    if (sourcePath.includes('crm-contacts.controller')) {
      process.stderr.write('CUSTOM_TRANSFORMER_CALLED: ' + sourcePath + '\n');
    }
    const result = ts.transpileModule(sourceText, {
      fileName: sourcePath,
      compilerOptions: TSCONFIG,
    });
    return {
      code: result.outputText,
      map: result.sourceMapText ? JSON.parse(result.sourceMapText) : undefined,
    };
  },
};
