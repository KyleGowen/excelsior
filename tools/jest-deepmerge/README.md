# Jest configuration merge adapter

Jest 30's `jest-config` uses `deepmerge` to merge configuration defaults and
`globals`. The upstream package has no patched release for
[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4).

The root development dependency and override replace that package with this
small adapter around maintained `@fastify/deepmerge`. It preserves the two APIs
Jest uses: the default two-object merge and `merge.all(array)`. Arrays concatenate,
inputs remain unchanged, and enumerable symbols are preserved. Custom merge
options are outside this adapter's supported interface. This package is not an
application runtime dependency.

`tests/unit/jest-deepmerge.test.ts` checks configuration behavior and prototype
poisoning inputs. The full unit and integration suites verify Jest compatibility.
Remove the adapter when Jest drops the vulnerable dependency or a safe upstream
release is available.
