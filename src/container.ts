import { Module } from "./module";
import { BindingDefinition, DependencyKey, ModuleKey } from "./types";
import { Prettify } from "./utils";

const DEFAULT_MODULE_KEY = Symbol("DEFAULT");

export class Container<TBindings = unknown> {
  private modules = new Map<
    ModuleKey,
    Module<Record<DependencyKey, TBindings>>
  >();
  private singletonInstances = new Map<DependencyKey, unknown>();
  private scopedInstances = new Map<
    DependencyKey,
    Map<DependencyKey, unknown>
  >();
  private resolutionStack: DependencyKey[] = [];
  private currentScopeId: symbol | undefined;

  constructor() {
    this.modules.set(DEFAULT_MODULE_KEY, new Module());
  }

  protected get defaultModule() {
    return this.modules.get(DEFAULT_MODULE_KEY)!;
  }

  public bind<TKey extends DependencyKey, TImpl>(
    key: TKey,
    builder: BindingDefinition<TImpl, TBindings>,
  ) {
    // @ts-expect-error - key is yet to be binded
    this.defaultModule.bind(key, builder);

    return this as unknown as Container<
      Prettify<
        TBindings & {
          [P in TKey]: TImpl;
        }
      >
    >;
  }

  public get<TKey extends keyof TBindings>(key: TKey) {
    return this._get(key as DependencyKey) as TBindings[TKey];
  }

  private findLastBinding(key: DependencyKey) {
    const modulesArray = Array.from(this.modules.values());

    for (let i = modulesArray.length - 1; i >= 0; i--) {
      const m = modulesArray[i];
      const binding = m.get(key);

      if (binding) {
        return binding as BindingDefinition<unknown, TBindings>;
      }
    }

    return null;
  }

  private getLastBinding(key: DependencyKey) {
    const binding = this.findLastBinding(key);

    if (!binding) {
      throw new Error(`No binding found for key: ${key.toString()}`);
    }

    return binding;
  }

  private isCircularDependency(key: DependencyKey): boolean {
    return this.resolutionStack.includes(key);
  }

  private buildCycleOf(key: DependencyKey) {
    return [...this.resolutionStack, key].map((k) => k.toString()).join(" -> ");
  }

  private startCircularDependencyDetectionFor(dependencyKey: DependencyKey) {
    this.resolutionStack.push(dependencyKey);
  }

  private endCircularDependencyDetection() {
    this.resolutionStack.pop();
  }

  private _get<T>(dependencyKey: DependencyKey): T {
    if (this.isCircularDependency(dependencyKey)) {
      const cycle = this.buildCycleOf(dependencyKey);

      throw new Error(`Circular dependency detected: ${cycle}`);
    }
    this.startCircularDependencyDetectionFor(dependencyKey);
    try {
      const binding = this.getLastBinding(dependencyKey);
      const { factory, scope } = binding;

      if (scope === "singleton") {
        if (!this.singletonInstances.has(dependencyKey)) {
          this.singletonInstances.set(
            dependencyKey,
            factory(this.resolveDependency),
          );
        }

        return this.singletonInstances.get(dependencyKey) as T;
      }

      if (scope === "transient") {
        return factory(this.resolveDependency) as T;
      }

      if (scope === "scoped") {
        if (!this.currentScopeId) {
          throw new Error(
            `Cannot resolve scoped binding outside of a scope: ${dependencyKey.toString()}`,
          );
        }

        if (!this.scopedInstances.has(this.currentScopeId)) {
          this.scopedInstances.set(
            this.currentScopeId,
            new Map<DependencyKey, unknown>(),
          );
        }

        const scopeMap = this.scopedInstances.get(this.currentScopeId)!;

        if (!scopeMap.has(dependencyKey)) {
          scopeMap.set(dependencyKey, factory(this.resolveDependency));
        }

        return scopeMap.get(dependencyKey) as T;
      }
      throw new Error(`Unknown scope: ${scope}`);
    } finally {
      this.endCircularDependencyDetection();
    }
  }

  private resolveDependency = (depKey: DependencyKey): unknown => {
    return this._get(depKey);
  };

  public load<TModuleBindings>(
    moduleKey: ModuleKey,
    module: Module<TModuleBindings>,
  ) {
    this.modules.set(moduleKey, module);

    return this as unknown as Container<
      TBindings & { [P in keyof TModuleBindings]: TModuleBindings[P] }
    >;
  }

  public unload(moduleKey: ModuleKey) {
    this.singletonInstances.clear();
    this.modules.delete(moduleKey);

    return this;
  }

  public runInScope<T>(callback: () => T): T {
    const previousScopeId = this.currentScopeId;

    this.currentScopeId = Symbol("scope");
    try {
      return callback();
    } finally {
      this.scopedInstances.delete(this.currentScopeId);
      this.currentScopeId = previousScopeId;
    }
  }
}

export function createContainer() {
  return new Container();
}
