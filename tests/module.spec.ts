import { beforeEach, describe, expect, it } from "vitest";

import {
  type Container,
  createContainer,
  createModule,
  toFunction,
  toHigherOrderFunction,
  toValue,
} from "../src";
import { DI } from "./examples/di";
import { HigherOrderFunctionWithDependencyObject } from "./examples/hoc-fns";
import { sayHelloWorld } from "./examples/simple-fns";
import { MyServiceInterface, SayHelloType } from "./examples/types";

describe("Module", () => {
  let container: Container;

  beforeEach(() => {
    container = createContainer();
  });

  describe("When a module is loaded", () => {
    describe.each([Symbol("myModule"), "myModule"])(
      "When the module has dependencies",
      (moduleKey) => {
        it(`should return all dependencies of module with key: ${moduleKey.toString()}`, () => {
          const c = createContainer().load(
            moduleKey,
            createModule().bind("SIMPLE_FUNCTION", toFunction(sayHelloWorld)),
          );

          const sayHello = c.get("SIMPLE_FUNCTION");

          expect(sayHello()).toBe("hello world");
        });
      },
    );

    describe("When a dependency of the module is registered in another module", () => {
      it("should correctly resolve all dependencies", () => {
        const m1 = createModule();
        const m2 = createModule();
        const m3 = createModule();

        m1.bind(DI.DEP1, toValue("dependency1"));
        m2.bind(DI.DEP2, toValue(42));
        m3.bind(
          DI.MY_SERVICE,
          toHigherOrderFunction(HigherOrderFunctionWithDependencyObject, {
            dep1: DI.DEP1,
            dep2: DI.DEP2,
          }),
        );

        container.load(Symbol("module1"), m1);
        container.load(Symbol("module2"), m2);
        container.load(Symbol("module3"), m3);

        const myService = container.get<MyServiceInterface>(DI.MY_SERVICE);

        expect(myService.runTask()).toBe(
          "Executing with dep1: dependency1 and dep2: 42",
        );
      });

      it("should take the last registered values", () => {
        // Arrange
        const module1 = createModule();

        module1.bind(DI.DEP1, toValue("OLD dependency1"));
        module1.bind(DI.MY_SERVICE, toFunction(sayHelloWorld));

        const module2 = createModule();

        module2.bind(DI.DEP1, toValue("NEW dependency1"));

        const module3 = createModule();

        module3.bind(
          DI.MY_SERVICE,
          toHigherOrderFunction(HigherOrderFunctionWithDependencyObject, {
            dep1: DI.DEP1,
            dep2: DI.DEP2,
          }),
        );

        container.bind(DI.DEP2, toValue(42));
        container.load(Symbol("module1"), module1);
        container.load(Symbol("module2"), module2);
        container.load(Symbol("module3"), module3);

        // Act
        const myService = container.get<MyServiceInterface>(DI.MY_SERVICE);

        // Assert
        expect(myService.runTask()).toBe(
          "Executing with dep1: NEW dependency1 and dep2: 42",
        );
      });
    });
  });

  describe("When a module is unloaded", () => {
    describe("When another module has this dependency already registered", () => {
      it("should use the existing dependency", () => {
        // Arrange
        const MODULE1 = Symbol("myModule1");
        const MODULE2 = Symbol("myModule2");

        const m1 = createModule();
        const m2 = createModule();

        m1.bind(
          DI.SIMPLE_FUNCTION,
          toFunction(() => "module 1 hello world"),
        );
        container.load(MODULE1, m1);

        m2.bind(DI.SIMPLE_FUNCTION, toFunction(sayHelloWorld));
        container.load(MODULE2, m2);

        const sayHelloBeforeUnload = container.get<SayHelloType>(
          DI.SIMPLE_FUNCTION,
        );

        expect(sayHelloBeforeUnload()).toBe("hello world");

        // Act
        container.unload(MODULE2);

        // Assert
        const sayHelloAfterUnload = container.get<SayHelloType>(
          DI.SIMPLE_FUNCTION,
        );

        expect(sayHelloAfterUnload()).toBe("module 1 hello world");
      });
    });

    describe("When no other module has this dependency already registered", () => {
      it("should remove all its dependencies", () => {
        // Arrange
        const MY_MODULE = Symbol("myModule");

        const m = createModule();

        m.bind(DI.SIMPLE_FUNCTION, toFunction(sayHelloWorld));
        container.load(MY_MODULE, m);

        const sayHelloBeforeUnload = container.get<SayHelloType>(
          DI.SIMPLE_FUNCTION,
        );

        expect(sayHelloBeforeUnload()).toBe("hello world");

        // Act
        container.unload(MY_MODULE);

        // Assert
        expect(() =>
          container.get<SayHelloType>(DI.SIMPLE_FUNCTION),
        ).toThrowError(
          `No binding found for key: ${DI.SIMPLE_FUNCTION.toString()}`,
        );
      });
    });
  });
});
