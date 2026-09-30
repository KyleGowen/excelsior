import { isModuleLoadError } from '../../../frontend/src/app/isModuleLoadError';

describe('lazy page load errors', () => {
  it.each([
    new TypeError('Failed to fetch dynamically imported module: /assets/DatabasePage-old.js'),
    new TypeError('Importing a module script failed.'),
    new Error('error loading dynamically imported module'),
    new Error('Loading chunk 123 failed.'),
  ])('recognizes a missing JavaScript bundle', (error) => {
    expect(isModuleLoadError(error)).toBe(true);
  });

  it('does not label unrelated failures as a missing bundle', () => {
    expect(isModuleLoadError(new Error('Unable to save deck'))).toBe(false);
    expect(isModuleLoadError({ message: 'Failed to fetch dynamically imported module' })).toBe(false);
  });
});
