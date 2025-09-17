---
title: "Sigma Python #3: Descriptors"
date: 2023-07-13
tags: ["python"]
series: ["Sigma Python"]
series_order: 3
showAuthor: false
authors:
  - "piotr"
---

Python offers a range of powerful features for object-oriented programming, including descriptors. These enable you to define how class attribute modification and access occur, making it useful for enforcing value constraints, implementing computed properties, and customizing attribute access.

This article covers the fundamentals of descriptors and provides guidance on how to implement them in your Python code. It addresses the following questions:

- what is the definition of a descriptor
- how to create a descriptor from scratch
- how the descriptors actually work
- what can be built using descriptors

Descriptors may sound unfamiliar to you, but they are widely used in popular packages such as Django and SQLAlchemy. This article will provide you with a clear understanding of descriptors and enable you to develop your own.

## Anatomy of a descriptor

A descriptor is a type of class that includes either of the `__get__`, `__set__`, or `__delete__` methods. When an instance of this class is used as an attribute in another class, it is referred to as a *managed attribute*. To illustrate, here is an example of a basic descriptor class and how it can be used as a managed attribute:

```python
class PositiveInt:
    def __init__(self, name: str) -> None:
        self.name = name

    def __set__(self, obj: object, value: int) -> None:
        if value <= 0:
            raise ValueError(f"Value of '{self.name}' must be a positive int")
        obj.__dict__[self.name] = value

    def __get__(self, obj: object, cls: type) -> int:
        return obj.__dict__[self.name]


class SomeClass:
    x = PositiveInt("x")
    y = PositiveInt("y")

    def __init__(self, x: int, y: int) -> None:
        self.x = x
        self.y = y


some_object = SomeClass(1, 2)
print(some_object.x)
print(some_object.y)
some_object.y = 0
```

The `PositiveInt` descriptor is used to set integer attributes in a class. Its primary function is to ensure that the number passed is greater than zero. This check is performed within the `__set__` magic method, which is triggered whenever a new value is assigned to an attribute. If the value is valid, it is stored in the instance's dictionary of writable attributes, called `__dict__`.

There are a few important things to note about the `PositiveInt` structure. Firstly, it also includes the `__get__` method. This is necessary in order to retrieve the value from the original class. However, the `__del__` method is not included. It was needed for this particular example, and it is acceptable for a descriptor class to not implement it. In fact, a descriptor class only needs to include one of the three methods. Finally, it is worth noting that inheritance is not required in order to implement a descriptor. This is because descriptors are protocol-based feature.

When the code is executed, the output is as follows:

```console
1
2
Traceback (most recent call last):
	# trunkated
ValueError: Value of 'y' must be a positive int
```

The final workflow appears like there are regular attributes, but in reality, the power of Python Data Model lies in its ability to handle complex implementation behind the scenes. In this case, the descriptor manages the assignment and retrieval of values. The values are initially set in the `__init__` method, and then, an error occurs due to the last assignment.

Upon examining `PositiveInt`, it may seem more practical to store the value within the descriptor rather than in the original class. This can be achieved by adding `self.__dict__[self.name] = value` in the `__set__` method. To investigate such a case, take a look at the "improved" example:

```python
class NegativeInt:
    def __init__(self, name: str) -> None:
        self.name = name

    def __set__(self, obj: object, value: int) -> None:
        if value >= 0:
            raise ValueError(f"Value of '{self.name}' must be a negative int")
        self.__dict__[self.name] = value

    def __get__(self, obj: object, cls: type) -> int:
        return self.__dict__[self.name]


class DifferentClass:
    x = NegativeInt("x")


some_object = DifferentClass()
some_object.x = -5
print(some_object.x)

different_object = DifferentClass()
different_object.x = -6
print(different_object.x)

print(some_object.x)
```

The `NegativeInt` descriptor functions similarly to `PositiveInt`, but in the opposite direction. It also operates on data that is stored within the descriptor class. The following result is produced when executing this code:

```console
-5
-6
-6
```

It appears that changing the value of `different_object.x` to -6 also changed the value of the `some_object` attribute. This is because descriptors are class attributes that are initialized only once during import time. Therefore, both objects of the `DifferentClass` share the same descriptor object. To ensure proper functioning, the descriptor object must be smart enough to work with the data of the object it belongs to.

In previous examples, it was necessary to manually set the name and retrieve the value using that name. However, this approach can lead to repetitive code in all descriptors. Thankfully, the `__set_name__` magic method provides a solution. When the interpreter calls this method on all descriptors in the class, it eliminates the need for repetitive `__init__` and `__get__` methods. For instance:

```python
class PositiveInt:
    def __set_name__(self, owner: type, name: str):
        self.name = name

    def __set__(self, obj: object, value: int) -> None:
        if value <= 0:
            raise ValueError(f"Value of '{self.name}' must be a positive int")
        obj.__dict__[self.name] = value


class SomeClass:
    x = PositiveInt()
    y = PositiveInt()

    def __init__(self, x: int, y: int) -> None:
        self.x = x
        self.y = y


some_object = SomeClass(1, 2)
print(some_object.x)
print(some_object.y)
```

The `PositiveInt` descriptor remains the same as before, but it no longer contains the `__init__` method. Instead, it includes the `__set_name__` method, which will be called with the `x` and `y` names in this particular case. This modification means that the `__get__` method implementation is also unnecessary, as the attribute name is identical in both classes, and the value can be retrieved from the `SomeClass` instance.

Now with the anatomy of descriptors covered, you should have a solid understanding of how they function. The next section will go over the implementation of a more real-world scenario.

## JSON Attribute

Descriptors are an embodiment of encapsulation. They hide implementation and complexity, making them perfect for validation, caching, and interacting with non-in-memory storage like databases and file systems. For example, the `JSONAttribute` descriptor works with JSON files while the target class declares attributes as usual.

```python
import json
from typing import Any


class JSONAttribute:
    """A descriptor for working with JSON files."""

    def __set_name__(self, owner: type, name: str):
        self.name = name
        self.path = f"{owner.__name__}.json"

    def __set__(self, obj: object, value: Any) -> None:
        """Set the value in the JSON file."""
        try:
            f = open(self.path, "r+")
            content = json.load(f)
        except FileNotFoundError:
            f = open(self.path, "a+")
            content = {}

        content[self.name] = value
        f.seek(0)
        json.dump(content, f, indent=4)
        f.close()

    def __get__(self, obj: object, owner: type) -> Any:
        """Get the value from the JSON file."""
        try:
            f = open(self.path, "r")
        except FileNotFoundError:
            f = open(self.path, "a+")
            json.dump({}, f)
            return None

        value = json.load(f).get(self.name)
        f.close()
        return value


class JSONReaderWriter:
    x = JSONAttribute()
    y = JSONAttribute()


rw = JSONReaderWriter()
rw.x = 1
rw.y = 2
print(rw.x, rw.y)
```

Without delving too deeply into the details of `json` implementation, `JSONAttribute` has three core functionalities:

- creating a JSON file named after the class it is used in
- setting the value of an attribute inside the JSON file
- retrieving the value of the attribute from the JSON file

When executed, this code, of course, prints `1 2`, but more importantly, the `JSONReaderWriter.json` file is created and the values are stored inside it. This is impressive because the end user of this code sees the values coming from the instance of the class, but they are actually nowhere to be found within it.

You have now seen a real-world use case and should be able to implement a descriptor for your own needs. The final chapter covers some of the most popular descriptor examples.

## Descriptors Are ubiquitous

As mentioned previously, even if you haven't been familiar with descriptors, you've probably used them before, without realizing it. One common example is the `property` decorator, which is a descriptor factory that creates a descriptor. The decorated method acts as a getter, but you can also implement setter and deleter methods.

Another popular example includes models and fields in Django. In this case, descriptors are a way to abstract away the details of working with a database, or a file system. However, Django uses metaclasses on top of descriptors, making the process more complex.

An example of a more modern Python library is Pydantic fields. They behave similarly to Django in that they also "hide" field behavior. However, in this case, descriptors are used to provide additional information about the field and attach necessary validation.

## Summary

Descriptors are one of the features that make Python's OOP so unique. They allow for powerful customization of attribute access and manipulation. This article explored the topic of descriptors, covering how to build them, what they can be used for, and what descriptors developers are encountering on a daily basis. Hopefully, you gained some valuable insights and you are able to work with descriptors in your projects.

## Sources

Code examples used in the article can be found here: [**link**](https://github.com/ttyobiwan/sigma_python).

The biggest inspiration for these articles and source of my knowledge is the [**Fluent Python**](https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/) book by Luciano Ramalho. I highly encourage you to check it out; you will not be disappointed.
