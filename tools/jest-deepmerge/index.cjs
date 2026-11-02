// Jest uses default recursive merging and .all(), without custom merge options.
// Use the maintained implementation instead of the unpatched deepmerge package.
const createMerge = require('@fastify/deepmerge');
const merge = createMerge({ symbols: true });

merge.all = function mergeAll(objects) {
  if (!Array.isArray(objects)) throw new TypeError('first argument should be an array');
  return objects.reduce((target, source) => merge(target, source), {});
};

module.exports = merge;
