declare function merge<T>(target: T, source: Partial<T>): T;
declare namespace merge {
  function all<T>(objects: Partial<T>[]): T;
}
export = merge;
