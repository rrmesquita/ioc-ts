export type DependencyKey = symbol | string;

export type ModuleKey = symbol | string;

export type Scope =
  /**
   * The container returns the same instance every time a dependency is resolved.
   */
  | "singleton"

  /**
   * The container returns a new instance every time the dependency is resolved.
   */
  | "transient"

  /**
   * The container returns the same instance within a scope. Different scopes will have different instances.
   * To use the scoped scope, you need to create a scope using `runInScope`.
   */
  | "scoped";

export type DependencyObject<TBindings> = {
  [key: string]: keyof TBindings;
};

export type DependencyArray<TBindings> = (keyof TBindings)[];

export type ResolveFunction<TBindings> = <TKey extends keyof TBindings>(
  dependencyKey: TKey,
) => TBindings[TKey];

export type BindingDefinition<TValue, TBindings> = {
  factory: (resolve: ResolveFunction<TBindings>) => TValue;
  scope: Scope;
};
