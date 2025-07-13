export type DependencyKey = symbol | string;

export type ModuleKey = symbol | string;

export type Scope = "singleton" | "transient" | "scoped";

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
