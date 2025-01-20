/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  entryPoints: ['src/requestSender/requestSender.ts', 'src/typedRequestHandler/typedRequestHandler.ts'],
  out: 'docs',
  excludeInternal: true,
  includeVersion: true,
  categorizeByGroup: true,
  navigation: {
    includeGroups: true,
  },
};
