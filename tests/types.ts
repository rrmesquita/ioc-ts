import { expectTypeOf } from "expect-type";

import {
  createModule,
  createContainer,
  toClass,
  toFactory,
  toHigherOrderFunction,
  toValue,
} from "../src";
import { MyServiceClassWithoutDependencies } from "./examples/classes";
import {
  HigherOrderFunctionWithDependencies,
  HigherOrderFunctionWithDependencyObject,
  HigherOrderFunctionWithoutDependency,
} from "./examples/hoc-fns";
import {
  MyServiceInterface,
  ServiceWithoutDependencyInterface,
} from "./examples/types";

const m = createModule()
  .bind("module.toValue.string", toValue("str"))
  .bind("module.toValue.string.literal", toValue("str" as const))
  .bind("module.toValue.number", toValue(42))
  .bind("module.toValue.number.literal", toValue(42 as const))
  .bind("module.toValue.bool", toValue(true))
  .bind("module.toValue.bool.literal", toValue(true as const))
  .bind("module.toValue.array", toValue([1, 2, 3]))
  .bind(
    "module.toFactory.string",
    toFactory(() => "str"),
  )
  .bind(
    "module.toFactory.number",
    toFactory(() => 42),
  )
  .bind(
    "module.toFactory.bool",
    toFactory(() => true),
  )
  .bind(
    "module.toFactory.resolve.string",
    toFactory((r) => r("module.toFactory.string")),
  )
  .bind(
    "module.toFactory.resolve.number",
    toFactory((r) => r("module.toFactory.number")),
  )
  .bind(
    "module.toHoc.withoutDeps",
    toHigherOrderFunction(HigherOrderFunctionWithoutDependency),
  )
  .bind(
    "module.toHoc.withDepsArray",
    toHigherOrderFunction(HigherOrderFunctionWithDependencies, [
      "module.toValue.string",
    ]),
  )
  .bind(
    "module.toHoc.withDepsArray.unbound",
    // @ts-expect-error dependency is not binded
    toHigherOrderFunction(HigherOrderFunctionWithDependencies, ["unbound"]),
  )
  .bind(
    "module.toHoc.withDepsObject",
    toHigherOrderFunction(HigherOrderFunctionWithDependencyObject, {
      foo: "module.toValue.string",
      bar: "module.toValue.number",
    }),
  )
  .bind(
    "module.toHoc.withDepsObject.unbound",
    // @ts-expect-error dependency is not binded
    toHigherOrderFunction(HigherOrderFunctionWithDependencyObject, {
      foo: "module.toValue.string",
      bar: "unbound",
    }),
  )
  .bind("module.toClass", toClass(MyServiceClassWithoutDependencies));

// module.toValue
expectTypeOf(m.get("module.toValue.string")).toBeString();
expectTypeOf(m.get("module.toValue.string.literal")).toEqualTypeOf<"str">();
expectTypeOf(m.get("module.toValue.number")).toBeNumber();
expectTypeOf(m.get("module.toValue.number.literal")).toEqualTypeOf<42>();
expectTypeOf(m.get("module.toValue.bool")).toBeBoolean();
expectTypeOf(m.get("module.toValue.bool.literal")).toEqualTypeOf<true>();
expectTypeOf(m.get("module.toValue.array")).toEqualTypeOf<number[]>();

// module.toFactory
expectTypeOf(m.get("module.toFactory.string")).toBeString();
expectTypeOf(m.get("module.toFactory.number")).toBeNumber();
expectTypeOf(m.get("module.toFactory.bool")).toBeBoolean();
expectTypeOf(m.get("module.toFactory.resolve.string")).toBeString();
expectTypeOf(m.get("module.toFactory.resolve.number")).toBeNumber();

// module.toHoc
expectTypeOf(
  m.get("module.toHoc.withoutDeps"),
).toEqualTypeOf<ServiceWithoutDependencyInterface>();
expectTypeOf(
  m.get("module.toHoc.withDepsArray"),
).toEqualTypeOf<MyServiceInterface>();
expectTypeOf(
  m.get("module.toHoc.withDepsObject"),
).toEqualTypeOf<MyServiceInterface>();

// module.toClass
expectTypeOf(
  m.get("module.toClass"),
).toEqualTypeOf<MyServiceClassWithoutDependencies>();

const c = createContainer()
  .bind("toValue.string", toValue("str"))
  .bind("toValue.number", toValue(42))
  .bind("toValue.bool", toValue(true))
  .bind("toValue.const", toValue(true as const))
  .bind("toValue.array", toValue([1, 2, 3]))
  .bind(
    "toHoc.string",
    toHigherOrderFunction(() => "example"),
  )
  .bind(
    "toHoc.number",
    toHigherOrderFunction(() => 42),
  )
  .bind(
    "toHoc.withDeps",
    toHigherOrderFunction((name) => ({ name }), ["toValue.string"]),
  )
  .bind(
    "factory",
    toFactory(() => "factory example"),
  )
  .load("m", m);

expectTypeOf(c.get("toValue.string")).toEqualTypeOf<string>();
expectTypeOf(c.get("toValue.number")).toEqualTypeOf<number>();
expectTypeOf(c.get("toValue.bool")).toEqualTypeOf<boolean>();
expectTypeOf(c.get("toValue.const")).toEqualTypeOf<true>();
expectTypeOf(c.get("toValue.array")).toEqualTypeOf<number[]>();
expectTypeOf(c.get("toHoc.string")).toEqualTypeOf<string>();
expectTypeOf(c.get("toHoc.number")).toEqualTypeOf<number>();
expectTypeOf(c.get("toHoc.withDeps")).toEqualTypeOf<{ name: string }>(); // fails because we're not mapping dependencies to args
expectTypeOf(c.get("toHoc.withDeps").name).toEqualTypeOf<string>(); // same as above

// @ts-expect-error unbound
m.bindings.get("module.unbound");

// @ts-expect-error unbound
c.get("module.unbound");

// @ts-expect-error unbound
c.get("unbound");
