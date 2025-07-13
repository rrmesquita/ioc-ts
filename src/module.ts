import { BindingDefinition, DependencyKey } from "./types";
import { Prettify } from "./utils";

export class Module<TBindings> {
  protected bindings = new Map<keyof TBindings, TBindings[keyof TBindings]>();

  public bind<TKey extends DependencyKey, TImpl>(
    key: TKey,
    builder: BindingDefinition<TImpl, TBindings>
  ) {
    // @ts-expect-error - key is yet to be binded
    this.bindings.set(key, builder);

    return this as unknown as Module<
      Prettify<
        TBindings & {
          [P in TKey]: TImpl;
        }
      >
    >;
  }

  public get<TKey extends keyof TBindings>(key: TKey) {
    return this.bindings.get(key) as TBindings[TKey];
  }
}

export function createModule() {
  return new Module();
}
