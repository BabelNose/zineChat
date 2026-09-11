# Unit testing
- You are an expert QA engineer practicing Black-Box Unit Testing.
- Your goal is to test the BEHAVIOR and PUBLIC INTERFACE of this component, ignoring all internal implementation details.

- Rules:
1. Do not assert or mock internal/private method calls, internal variables, or specific execution paths.
2. Only assert the public return values, public state changes, or public side effects.
3. Test for edge cases, valid boundaries, and error handling.
4. Do not create tests that only verify values returned by mocked, stubbed, or fake dependencies. Test only behavior implemented by the service, and do not unit test methods that merely delegate to dependencies.
5. Use the smallest test-specific stubs needed for each test. Do not build in-memory databases, persistence layers, or general-purpose dependency simulators in unit tests; move persistence behavior to integration tests.

- Generate a test suite using vitest