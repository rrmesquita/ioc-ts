import {
  BindingDefinition,
  DependencyArray,
  DependencyObject,
  ResolveFunction,
  Scope,
} from "./types";
import {
  isDependencyArray,
  isDependencyObject,
  resolveDependenciesArray,
  resolveDependenciesObject,
} from "./utils";

const toValue = <TValue, TBindings>(
  value: TValue,
): BindingDefinition<TValue, TBindings> => {
  return { factory: () => value, scope: "singleton" };
};

const toFactory = <TValue, TBindings>(
  factory: (resolve: ResolveFunction<TBindings>) => TValue,
  scope: Scope = "singleton",
): BindingDefinition<TValue, TBindings> => {
  return {
    factory: (resolve: ResolveFunction<TBindings>) => factory(resolve),
    scope,
  };
};

// This can be improved by infering the depedency object keys...
// But it would be faulty because, what if there's a second parameter?
// I can't find a good reason to support the dependency object overload
// or maybe ditch this entirely and recommend `toFactory`
const toHigherOrderFunction = <TValue, TBindings>(
  fn: (...deps: any[]) => TValue,
  dependencies?: DependencyArray<TBindings> | DependencyObject<TBindings>,
  scope: Scope = "singleton",
): BindingDefinition<TValue, TBindings> => {
  if (
    dependencies &&
    !isDependencyArray(dependencies) &&
    !isDependencyObject(dependencies)
  ) {
    throw new Error("Invalid dependencies type");
  }

  const factory = (resolve: ResolveFunction<TBindings>) => {
    if (!dependencies) {
      return fn();
    }

    if (isDependencyArray(dependencies)) {
      return fn(...resolveDependenciesArray(dependencies, resolve));
    }

    if (isDependencyObject(dependencies)) {
      return fn({ ...resolveDependenciesObject(dependencies, resolve) });
    }

    // TODO: improve this error
    throw new Error("Cannot handle dependencies.");
  };

  return { factory, scope };
};

// exact same problem as toHoc
const toClass = <TValue, TBindings>(
  AnyClass: new (...args: any[]) => TValue,
  dependencies?: DependencyArray<TBindings> | DependencyObject<TBindings>,
  scope: Scope = "singleton",
): BindingDefinition<TValue, TBindings> => {
  if (
    dependencies &&
    !isDependencyArray(dependencies) &&
    !isDependencyObject(dependencies)
  ) {
    throw new Error("Invalid dependencies type");
  }

  const factory = (resolve: ResolveFunction<TBindings>) => {
    if (!dependencies) {
      return new AnyClass();
    }

    if (isDependencyArray(dependencies)) {
      const resolvedDeps = resolveDependenciesArray(dependencies, resolve);

      return new AnyClass(...resolvedDeps);
    }

    if (isDependencyObject(dependencies)) {
      const resolvedDeps = resolveDependenciesObject(dependencies, resolve);

      return new AnyClass({ ...resolvedDeps });
    }

    return new AnyClass();
  };

  return { factory, scope };
};

const toFunction = toValue;
const toCurry = toHigherOrderFunction;

export {
  toClass,
  toCurry,
  toFactory,
  toFunction,
  toHigherOrderFunction,
  toValue,
};
