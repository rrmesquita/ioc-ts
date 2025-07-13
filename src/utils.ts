import { DependencyArray, DependencyObject, ResolveFunction } from "./types";

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export function resolveDependenciesArray<TBindings>(
  dependencies: DependencyArray<TBindings>,
  resolve: ResolveFunction<TBindings>,
) {
  return dependencies.map(resolve);
}

export function resolveDependenciesObject<TBindings>(
  dependencies: DependencyObject<TBindings>,
  resolve: ResolveFunction<TBindings>,
) {
  const entries = Object.entries(dependencies);

  return Object.fromEntries(
    entries.map(([key, dependency]) => [key, resolve(dependency)]),
  );
}

export function isDependencyArray<TBindings>(
  dependencies: DependencyArray<TBindings> | DependencyObject<TBindings>,
): dependencies is DependencyArray<TBindings> {
  return Array.isArray(dependencies);
}

export function isDependencyObject<TBindings>(
  dependencies: DependencyArray<TBindings> | DependencyObject<TBindings>,
): dependencies is DependencyObject<TBindings> {
  return (
    dependencies !== null &&
    typeof dependencies === "object" &&
    !Array.isArray(dependencies)
  );
}
