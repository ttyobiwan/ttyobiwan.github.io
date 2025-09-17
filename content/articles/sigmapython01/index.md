---
title: "Sigma Python #1: Decorators"
date: 2023-03-17
tags: ["python"]
series: ["Sigma Python"]
series_order: 1
showAuthor: false
authors:
  - "piotr"
---

One of the most interesting and useful features of Python are decorators, which are callable objects that modify the behavior of other pieces of code without any additional changes. Decorators are a fundamental concept in Python, and they are used extensively in the language's standard library, as well as in third-party libraries and frameworks.

Some of the most common usages of decorators include:

- logging
- timing
- caching
- error handling

Decorators are also a great way to create reusable code since they can be applied to multiple functions.

This article explores the topic of Python decorators, including their following aspects:

- structure
- behavior
- closures
- parametrization
- class-based implementation

Each section offers simple code examples related to a specific subject, with one more complex and practical example concluding the article in the last section.

Whether you are a beginner or an experienced Python programmer, understanding decorators is essential for writing clean, concise, and maintainable code. By the end of this article, you will have a solid understanding of Python decorators and be able to use them in your own code to improve its functionality and readability.

## Anatomy of a decorator

A decorator, as previously said, is a piece of code that adds or modifies the functionality of another piece of code. Such behavior is achieved by creating either a function or a class that accepts an existing function as a parameter and 'decorates' it. The following example shows a simple decorator and two ways to decorate a function:

```python
from typing import Any, Callable

def announcer(func: Callable[..., Any]) -> Callable[..., Any]:
    print(f"Decorating {func.__name__}")

    def wrapper(*args, **kwargs) -> Any:
        print(f"Calling {func.__name__} with {args} and {kwargs}")
        result = func(*args, **kwargs)
        print(f"The result is {result}")
        return result

    return wrapper

@announcer
def to_fahrenheit(celsius: float) -> float:
    return (celsius * 1.8) + 32

def to_celsius(fahrenheit: float) -> float:
    return (fahrenheit - 32) / 1.8

to_celsius = announcer(to_celsius)

if __name__ == "__main__":
    to_fahrenheit(42.0)
    to_fahrenheit(celsius=11.0)
    to_celsius(452.0)
    to_celsius(fahrenheit=111.0)
```

`announcer` is a decorator that replaces the decorated function with a new function that takes the following steps:

1. Prints the name of called function and passed arguments.
2. Calls the decorated function and saves the result.
3. Prints and returns the result.

Executing the preceding code yields the following result:

```plaintext
Decorating to_fahrenheit
Decorating to_celsius
Calling to_fahrenheit with (42,) and {}
The result is 107.60000000000001
Calling to_fahrenheit with () and {'celsius': 11}
The result is 51.8
Calling to_celsius with (452,) and {}
The result is 233.33333333333331
Calling to_celsius with () and {'fahrenheit': 111}
The result is 43.888888888888886
```

The output reveals that `wrapper` function from the decorator replaced both `to_fahrenheit` and `to_celsius` functions. On top of the calculations happening in the initial implementation, the functions now make the `print` calls added in the decorator.

It is also worth noticing when the first two prints actually appear. Even if both `to_fahrenheit` and `to_celsius` were removed, those two prints would still be present. This is because decorators are being called at the import time. When you consider how `to_celsius` is decorated, where the `announcer` decorator is explicitly called, it makes a lot of sense.

One caveat that isn't visible in the output is what both decorated functions actually became and how IDE (like VSCode or PyCharm) might be reacting to them afterward. Considering the following changes to the previous code:

```python
if __name__ == "__main__":
    print(to_fahrnheit)
    print(to_fahrenheit.__annotations__)
    print(to_celsius)
    print(to_celsius.__annotations__)
```

Now, the outcome is as follows:

```plaintext
Decorating to_fahrenheit
Decorating to_celsius
<function announcer.<locals>.wrapper at 0x7f452835a7a0>
{'return': typing.Any}
<function announcer.<locals>.wrapper at 0x7f452821aa70>
{'return': typing.Any}
```

The output now may be unexpected, and it also reveals a larger issue: decorated functions were not only 'enriched' with new features, but they were actually replaced by the decorator's `wrapper` function. In this context, 'replaced' means that any information about the initial function, such as name or type annotations, is gone. That is why your IDE may be unable to assist you with autocompletion while dealing with decorated functions. Code just does not include the necessary information any longer.

While you could manually add all the necessary information to the wrapper function, there is a built-in solution to address this problem:

```python
import functools

def announcer(func: Callable[..., Any]) -> Callable[..., Any]:
    print(f"Decorating {func.__name__}")

    @functools.wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        print(f"Calling {func.__name__} with {args} and {kwargs}")
        result = func(*args, **kwargs)
        print(f"The result is {result}")
        return result

    return wrapper
```

`functools` is a Python standard library that contains several high-order functions – ones that are used for modifying existing functions. `wraps` is a decorator that accepts the decorated function as an argument and then updates the wrapper that was meant to replace the original function. Under the hood, `wraps` invokes the `update_wrapper` function, which provides probably the clearest description of this process:

> Update a wrapper function to look like the wrapped function

With these `announcer` changes in place, the output now is the following:

```plaintext
Decorating to_fahrenheit
Decorating to_celsius
<function to_fahrenheit at 0x7f540e3ae7a0>
{'celsius': <class 'float'>, 'return': <class 'float'>}
<function to_celsius at 0x7f540e26ea70>
{'fahrenheit': <class 'float'>, 'return': <class 'float'>}
```

In this case, `wrapper` function from the decorator still replaces the decorated functions, but now it contains all the essential information copied from the initial function.

Next comes the topic of free variables and closures, so how decorated functions are able to 'share state' between themselves.

## Closures

Take a look back at the very first example and its output. If the wrapper function replaced the decorated functions, then how did it still have access to their original names? You can see it did in the first `print` call in the `wrapper`. To make it more clear, consider the following example:

```python
from typing import Any, Callable

def register(func: Callable[..., Any]) -> Callable[..., Any]:
    results = []

    def wrapper(*args, **kwargs) -> Any:
        result = func(*args, **kwargs)
        results.append(result)
        print(f"Results: {results}")
        return result

    return wrapper

@register
def to_fahrenheit(celsius: float) -> float:
    return (celsius * 1.8) + 32

if __name__ == "__main__":
    to_fahrenheit(10.0)
    to_fahrenheit(20.0)
    to_fahrenheit(30.0)
```

The `register` decorator stores the results of all the calls that happen on the functions it decorates. Calling this code results in the following output:

```plaintext
Results: [50.0]
Results: [50.0, 68.0]
Results: [50.0, 68.0, 86.0]
```

This outcome should come as no surprise, given the code's simplicity. However, another question that may arise is how the `wrapper` function is able to reach the `results` variable. The `register` decorator returns the `wrapper` function, hence `results` should be outside its scope. The `func` variable in the first example was similar in that it belonged to the `announcer` decorator rather than the `wrapper` function. That behavior is possible thanks to Python features known as _free variables_ and _closures_.

When you create a nested function that references a variable that is neither local nor global, Python creates a _closure_ to bind the variable to the nested function. Such variables are known as _free variables_, and they are stored in a `__closure__` attribute. This is particularly common with decorators, where the decorated function is a free variable. To illustrate this on a previous example, consider the following changes:

```python
if __name__ == "__main__":
    to_fahrenheit(10.0)
    to_fahrenheit(20.0)
    to_fahrenheit(30.0)
    for cell in to_fahrenheit.__closure__:
        print(cell.cell_contents)
```

`__closure__` attribute contains objects called _cells_ that store the values of free variables in a `cell_contents` attribute. Here is the output produced by the above code:

```plaintext
Results: [50.0]
Results: [50.0, 68.0]
Results: [50.0, 68.0, 86.0]
<function to_fahrenheit at 0x7fdca98d1da0>
[50.0, 68.0, 86.0]
```

The last two lines show that the decorated function does, in fact, save the additional values. The original function is the first one – that explains how the `wrapper` in the first example was able to print the name of the decorated function. The second is the `result` variable created in the decorator. This demonstrates how powerful feature the closures are: since `result` is mutable, all the decorated function can share a certain state.

The next section covers parametrization: how to provide arguments to a decorator before the decoration happens.

## Parametrization

It is fairly common to use a decorator that requires some configuration. One of the most popular examples is the `lru_cache` decorator from the `functools` standard library. It is used to cache the output of a decorated function based on its parameters. `lru_cache` comes with a default configuration, but you can also provide two additional arguments: `maxsize` and `typed`. The first indicates how many entries can be cached before the LRU policy begins to remove the oldest items. The latter determines whether the same values of various types should be cached separately. Take a look at this simple example:

```python
from functools import lru_cache

@lru_cache(maxsize=2)
def to_fahrenheit(celsius: float) -> float:
    print(f"Calling to_fahrenheit with {celsius}")
    return (celsius * 1.8) + 32

if __name__ == "__main__":
    to_fahrenheit(10.0)
    to_fahrenheit(20.0)
    to_fahrenheit(20.0)
    to_fahrenheit(30.0)
    to_fahrenheit(40.0)
    to_fahrenheit(20.0)
```

When `maxsize=2` is specified, only two results can be cached at the same time. The output of this code is the following:

```plaintext
Calling to_fahrenheit with 10
Calling to_fahrenheit with 20
Calling to_fahrenheit with 30
Calling to_fahrenheit with 40
Calling to_fahrenheit with 20
```

First, you can see that `print` with 20 was called just once, despite the fact that `to_fahrenheit` was called twice with 20 as the argument, indicating that the cache worked. But, at the very end, `to_fahrenheit(20.0)` didn't use the cache anymore. This is simply because calls with 30 and 40 took all the cache seats, forcing the output of `to_fahrenheit(20.0)` to be removed.

This basic example should demonstrate the potential of decorators' parametrization: not only you can add functionality to existing code, but you can also configure how it should behave.

Implementing a decorator that accepts some parameters can be tricky, and the syntax may appear confusing. Consider the following example:

```python
from typing import Any, Callable, TypeAlias

DecoratedFunc: TypeAlias = Callable[..., Any]

def retry(max_tries: int = 3) -> DecoratedFunc:
    def decorator(fn: DecoratedFunc) -> DecoratedFunc:
        def wrapper(*args, **kwargs) -> Any:
            for i in range(max_tries):
                try:
                    return fn(*args, **kwargs)
                except Exception as exc:
                    if i + 1 == max_tries:
                        raise exc
                    print(f"{fn.__name__} failed with {exc}, retrying")

        return wrapper

    return decorator

@retry(max_tries=2)
def to_celsius(fahrenheit: float) -> float:
    print(f"Calling to_celsius with {fahrenheit}")
    return (fahrenheit - 32) / 1.8

if __name__ == "__main__":
    to_celsius(100.0)
    to_celsius(200.0)
    to_celsius("300")
```

`retry` is a simple decorator that causes the decorated function to be called again if something fails inside it. It has a `max_tries` parameter, which specifies how many times should a decorated function be called before giving up if an exception persists. Here is the output of running the code:

```plaintext
Calling to_celsius with 100.0
Calling to_celsius with 200.0
Calling to_celsius with 300
to_celsius failed with unsupported operand type(s) for -: 'str' and 'int', retrying
Calling to_celsius with 300
Traceback (most recent call last):
  (trunkated error traceback)
  File "/sigma_py/decorators/decorators04.py", line 31, in to_celsius
    return (fahrenheit - 32) / 1.8
            ~~~~~~~~~~~^~~~
TypeError: unsupported operand type(s) for -: 'str' and 'int'
```

As you can see, the first two calls worked normally, but the third one triggered the retry mechanism. On the second unsuccessful retry, it gave up and raised the original exception. Of course, these kinds of `retry` decorators are usually way more sophisticated. The goal here was to test the `max_tries` parameter in action.

What can be confusing is how 'nested' the decorator became. The reason is fairly simple: in this case, `retry` is not actually a decorator, but rather a decorator factory. After receiving the arguments, it returns the decorator, which is the `decorator` function in this example. The `@` syntax then decorates the function underneath it. The rest remains the same: wrappers, closures, free variables, and so forth.

Because `max_tries` has a default value of 3, you might expect that you could use this decorator without the brackets, i.e., `@retry`. With this implementation, this is not possible, or at least will not produce the expected outcomes. Since `retry` is actually a decorator factory, using it without brackets would replace the decorated function with the `decorator` function. This would of course completely break the program.

However, it is possible to implement a decorator in a way that it would use the default parameters without the need to call it explicitly. This is done in the final section of the article, where `retry` decorator is going to be expanded.

With parametrization covered, the next topic is the implementation of decorators using a class-based approach.

## Class-based decorators

In Python, class instances that implement the `__call__` method can be invoked just like functions. This means, that it is possible to implement class-based decorators. Even though it doesn't provide any major advantages over the regular, functional approach, it can sometimes be easier to organize the code in a class.

Here is how the `retry` decorator from the previous example looks like when implemented as a class:

```python
from typing import Any, Callable, TypeAlias

DecoratedFunc: TypeAlias = Callable[..., Any]

class Retry:
    def __init__(self, max_tries: int = 3) -> None:
        self.max_tries = max_tries

    def __call__(self, fn: DecoratedFunc) -> DecoratedFunc:
        def wrapper(*args, **kwargs) -> Any:
            for i in range(self.max_tries):
                try:
                    return fn(*args, **kwargs)
                except Exception as exc:
                    if i + 1 == self.max_tries:
                        raise exc
                    print(f"{fn.__name__} failed with {exc}, retrying")

        return wrapper

@Retry(max_tries=2)
def to_celsius(fahrenheit: float) -> float:
    print(f"Calling to_celsius with {fahrenheit}")
    return (fahrenheit - 32) / 1.8

if __name__ == "__main__":
    to_celsius(100.0)
    to_celsius(200.0)
    to_celsius("300")
```

This code produces exactly the same output as the one in the preceding example.

Similar to the functional approach, calling `__init__` method of the `Retry` class is analogous to using a decorator factory. The class instance is then invoked using the `__call__` method to replace the decorated function with `wrapper`.

Using a decorator with a capitalized name might not appear Pythonic, but naming a class using the snake case convention is probably even worse. This can, however, be easily solved by adding a variable that references the class, i.e., `retry_that_thing = RetryThatThing`. Following that, a class-based decorator looks just like a function.

The final section goes back to the functional `retry` decorator in order to make it more powerful and customizable.

## Advanced scenario

The first version of the `retry` decorator was relatively straightforward. Its updated version includes the following features:

- ability to use the decorator without brackets
- parameter to specify exceptions for which to retry
- parameter to define a callback replacing the final `raise`

The code for the enriched `retry` decorator is as follows:

```python
from typing import Any, Callable, TypeAlias

DecoratedFunc: TypeAlias = Callable[..., Any]

def retry(
    max_tries: int | DecoratedFunc = 3,
    exceptions: tuple[type[Exception], ...] | None = None,
    on_giveup: Callable[[Exception], None] | None = None,
) -> DecoratedFunc:
    # Catch all exception by default
    if exceptions is None:
        exceptions = (Exception,)

    decorated_func = None

    # If decorator was used without brackets, then function is the first arg
    if callable(max_tries):
        decorated_func, max_tries = max_tries, 3

    def decorator(fn: DecoratedFunc) -> DecoratedFunc:
        def wrapper(*args, **kwargs) -> Any:
            for i in range(max_tries):
                try:
                    return fn(*args, **kwargs)
                except exceptions as exc:
                    if i + 1 == max_tries:
                        if on_giveup is None:
                            raise exc
                        return on_giveup(exc)

                    print(f"{fn.__name__} failed with {exc}, retrying")

        return wrapper

    # If decorated_func is already set, then run decoration immediately
    if decorated_func is not None:
        return decorator(decorated_func)

    return decorator

@retry
def to_celsius(fahrenheit: float) -> float:
    print(f"Calling to_celsius with {fahrenheit}")
    return (fahrenheit - 32) / 1.8

@retry(
    max_tries=2,
    exceptions=(TypeError,),
    on_giveup=lambda exc: print(f"Giving up: {exc}"),
)
def to_fahrenheit(celsius: float) -> float:
    print(f"Calling to_fahrenheit with {celsius}")
    return (celsius * 1.8) + 32

if __name__ == "__main__":
    to_celsius(100.0)
    to_fahrenheit(40)
    to_fahrenheit("50")
```

The `retry` function now accepts three parameters:

1. `max_tries`, which works just as previously
2. `exceptions`, which describes what exception classes should be handled by the retry mechanism
3. `on_giveup`, that specifies a callable to use in case of exceeding the `max_tries`

One notable change is that `max_tries` is now annotated as `int | DecoratedFunc`. This is due to the behavior of using `retry` without the brackets. In such a scenario, the decorated function is passed as the first argument. For the same reason, `if callable(max_tries)` line checks whether `max_tries` is something that can be called. If it is, all of the arguments should use their default values. The decorated function is then saved in a separate variable and at the very end it is directly decorated instead of returning the decorator.

The remaining two arguments are used in the `except` clause to add the extra behavior.

The output of the final `retry` version is the following:

```plaintext
Calling to_celsius with 100.0
Calling to_fahrenheit with 40
Calling to_fahrenheit with 50
to_fahrenheit failed with can't multiply sequence by non-int of type 'float', retrying
Calling to_fahrenheit with 50
Giving up: can't multiply sequence by non-int of type 'float'
```

It demonstrates that both usages of the decorator are working as expected and that the new functionalities are present as well.

## Summary

In conclusion, Python decorators offer a versatile way to modify the behavior of Python functions without modifying their original code. Decorators can be used to improve the functionality and maintainability of your Python code if you have a strong understanding of how they work and some common use cases. Decorators can help you build cleaner, more modular, and extensible Python code by harnessing the power of closures and higher-order functions.

## Sources

Code examples used in the article can be found here: [link](https://github.com/ttyobiwan/sigma_python).

The biggest inspiration for these articles and source of my knowledge is the [Fluent Python](https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/) book by Luciano Ramalho. I highly encourage you to check it out; you will not be disappointed.
