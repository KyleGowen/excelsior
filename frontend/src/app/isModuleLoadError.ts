/** Browser messages for failed lazy imports vary across engines. */
export function isModuleLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|loading chunk [^\n]+ failed|chunkloaderror/i.test(
    `${error.name} ${error.message}`,
  );
}
