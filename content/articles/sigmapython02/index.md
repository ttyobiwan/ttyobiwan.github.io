---
title: "Sigma Python #2: Generators"
date: 2023-05-23
tags: ["python"]
series: ["Sigma Python"]
series_order: 2
showAuthor: false
authors:
  - "piotr"
---

Python generators are a crucial feature with multiple uses, from lazy iteration to continuous data streaming. They are heavily adopted in popular packages such as FastAPI, SQLAlchemy, pytest, and others, highlighting their power and the importance of understanding how they work.

This article provides answers to the following questions about generators:

- What are they exactly?
- How do they work?
- What are generator expressions and subgenerators?
- What are some common use cases for generators?

Each section covers both theoretical and practical aspects of Python generators. By the end, you will have a strong comprehension of generators and their importance. The first section begins by defining what a generator is and how it operates.

## Anatomy of a generator

At first glance, the _generator function_ appears to be no different from a regular function. Consider the following example:

```python
from typing import Generator

def calculate(a: int, b: int) -> Generator[int | float, None, None]:
    print(f"Starting calculations for {a} and {b}")

    print("Sum")
    yield a + b

    print("Subtraction")
    yield a - b

    print("Multiplication")
    yield a * b

    print("Division")
    yield a / b

    print("Done calculating")
```

The defining characteristic of a generator function is the use of the `yield` keyword. When called, the generator function produces a generator, meaning that it can be seen as a _generator factory_.

To work with a generator, there are two methods. Consider the first example of how to use the `calculate` function:

```python
calculations = calculate(10, 5)
for result in calculations:
    print("Result:", result)
```

To start, the `calculate` generator function is used to create a generator object. It doesn't do anything else: without the `for` loop, no `print` outputs would appear. The code then goes through the generator output by iterating over it. This causes the generator to stop at each yield and pass it as a result in the loop. Overall, running this code produces the following result:

```plaintext
Starting calculations for 10 and 5
Sum
Result: 15
Subtraction
Result: 5
Multiplication
Result: 50
Division
Result: 2.0
Done calculating
```

If you want to work with a generator in a more direct way, you can use the `next` function. Here's an example of how to use the `calculate` generator in this manner:

```python
calculations = calculate(10, 5)
print(next(calculations))
print(next(calculations))
print(next(calculations))
print(next(calculations))
print(next(calculations))
```

Although the outcome is identical, the code now throws a `StopIteration` exception. This occurs because the generator gets exhausted after the final `yield` statement. As a result, it cannot be used again, and a new generator object is required to start over. When using a `for` loop to iterate, it automatically stops when the generator is exhausted, which is why there was no exception in the first example.

When using a generator, it's crucial to pay attention to when it stops and continues the process. If you only have one `next` call, you'll only see the `print` statement for the sum, indicating that the generator stopped at the first `yield`. This means that any remaining computations and `print` statements will not be executed. This feature can be very useful for adding some "laziness" to your code.

It is important to mention that the final print statement with the "Done calculating" message is called after the fifth `next` call. This is the same call that exhausts the generator, but it's also the only way to reach the code after the last "yield" statement. To sum up, when using a `for` loop or the `next` function, the generator jumps over subsequent `yield` statements and the code between them until there are no more yields. At that point, the final code is executed, and the generator is exhausted.

Although generators are not an easy topic, this introduction should provide you with a good understanding of how they operate. With this knowledge covered, you can now move on to further interactions with the generator object.

## Sending and returning

Generators use the `yield` keyword to temporarily pause execution and output a value, which is their core feature. However, generators also have the functionalities of _sending_ and _returning_.

In the first example, the type annotation `Generator[int | float, None, None]` indicates that the generator yields values of type integer or float, and the remaining two are types for sending or returning.

The `send` method of a generator object allows you to input a value into a generator during execution, which is then processed by the `yield` statement where the generator paused. Here is an example to illustrate this functionality:

```python
import random
from typing import Generator

def send_message(message: str) -> str:
    print(f"Sending: {message}")
    return str(random.randint(1, 1000))

def chat(message: str) -> Generator[str, str, None]:
    print("Starting a new chat")
    history = []

    while True:
        history.append(message)
        response = send_message(message)
        history.append(response)
        message = yield response

quick_chat = chat("hello")
print(next(quick_chat))
print(quick_chat.send("how are you doing?"))
print(quick_chat.send("oh, that is nice!"))
```

The `chat` generator function acts like a conversation. It starts with an initial message and uses the `send_message` function to send and receive messages while keeping a record of the conversation history. The generator object won't get exhausted because of the `while True` loop. When executed, the code produces the following output:

```plaintext
Starting a new chat
Sending: hello
786
Sending: how are you doing?
392
Sending: oh, that is nice!
416
```

To send values into a generator, you need to assign the result of `yield` to a variable (e.g. `message = yield response`). However, before sending anything, you must first ensure that the generator object proceeds to the first `yield` statement. Otherwise, there will be nothing to handle the sending. In the example above, this is achieved by calling the `next` function, which also sends the "hello" message. Once the generator is stopped at the `yield` statement, you can use the `send` method. In the example, the `send` method is used twice to reassign the `message` variable, which is then sent using the `send_message` function.

Adding a `send` feature can enhance the interaction of a generator. By including a `return` statement within the generator, you can further expand its functionalities. Check out the tweaked `chat` generator for an example:

```python
... # trunkated code

def chat(message: str) -> Generator[str, str, list[str]]:
    print("Starting a new chat")
    history = []

    while True:
        history.append(message)
        response = send_message(message)
        history.append(response)
        message = yield response
        if not message:
            return history

quick_chat = chat("hello")
print(next(quick_chat))
print(quick_chat.send("how are you doing?"))
print(quick_chat.send("oh, that is nice!"))

try:
    quick_chat.send("")
except StopIteration as e:
    print(e.value)
```

A new type annotation, `list[str]` has been added as the return type of the generator. If an empty value is passed via the `send` method, the generator will now return conversation history. The updated output is as follows:

```plaintext
Starting a new chat
Sending: hello
459
Sending: how are you doing?
817
Sending: oh, that is nice!
84
['hello', '459', 'how are you doing?', '817', 'oh, that is nice!', '84']
```

The generator got exhausted due to the return statement. However, you can retrieve the returned value from the exception by using the try/except syntax. This method may seem unusual, as it is not the typical way of using a generator. Generally, some iteration is used to go over the generator, which handles the exhaustion behind the scene. The above examples make use of the next and send methods just to showcase the underlying processes.

This knowledge should help you understand how to interact with generators better. Additionally, there are two more techniques to build and exhaust a generator to follow.

## Generator expressions

_Generator expressions_ provide a concise way of creating generators. They enable you to define generators in just one line of code, which is a sophisticated method for generating sequences of data. The syntax for creating a generator expression is like that of a list comprehension. For example, suppose you have a decorator that takes a list of numbers (which might be a large list), squares them, and yields only even numbers. In that case, you can use a generator function as follows:

```python
from typing import Generator

large_numbers_dataset = list(range(1, 11))
print(large_numbers_dataset)

def square_even(numbers: list[int]) -> Generator[int, None, None]:
    for n in numbers:
        if n % 2 == 0:
            yield n**2

squared = square_even(large_numbers_dataset)
print(squared)
print(list(squared))
```

And the output is the following:

```plaintext
[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
<generator object square_even at 0x7fc5789f4110>
[4, 16, 36, 64, 100]
```

The results are as expected. In this scenario, using a generator allows for the computation of a portion of the dataset. For instance, you can iterate over the `squared` generator and stop at the second outcome. In such case, you would receive only two results without processing the entire dataset. Hence, while a one-line list comprehension is feasible, it is not as efficient. Nonetheless, a one-line generator expression can be utilized. To do so, replace the `square_even` function with the implementation below:

```python
large_numbers_dataset = list(range(1, 11))
squared_exp = (n**2 for n in large_numbers_dataset if n % 2 == 0)
print(squared_exp)
print(list(squared_exp))
```

The outcome is now nearly the same:

```plaintext
<generator object <genexpr> at 0x7fc5789f5cb0>
[4, 16, 36, 64, 100]
```

The generator expression ultimately creates a generator object, similar to the generator function. However, it is more concise and expressive. It can be used like a list comprehension, but still maintains the laziness functionality of a generator. Moreover, generator expressions are suitable to be used as a function argument. For instance, consider the following example:

```python
large_numbers_dataset = list(range(1, 11))
print(sum(n**2 for n in large_numbers_dataset if n % 2 == 0))
```

The result is 220, which means that the generator yielded all the numbers as previously and they were all passed to the `sum` function. This is a clean and memory-efficient way of processing data without creating intermediate lists.

## Subgenerators

In Python, you can create hierarchical generators by using _subgenerators_. These are generators that are nested within other generators, making it possible to structure and organize your code in a modular and reusable manner. Essentially, subgenerators serve as an alternative method for "unpacking" a generator within another generator. Take a look at the code example below for reference:

```python
numbers_board = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]

for row in numbers_board:
    for cell in row:
        print(cell)
```

Naturally, the code displays numbers 1 to 9. Nonetheless, using a double `for` loop in your code is not the most optimal and elegant solution. A more efficient approach would be to use a generator:

```python
def cells(board: list[list[int]]) -> Generator[int, None, None]:
    for row in board:
        for cell in row:
            yield cell

for cell in cells(numbers_board):
    print(cell)
```

Although the outcome remains unchanged, your code outside of the function is now more concise and takes benefits from using a generator. Additionally, there is another enhancement you can make in this scenario: separate the two loops and delegate `for cell in row` to a distinct generator. This can be accomplished by implementing a subgenerator and the `yield from` syntax:

```python
def columns(row: list[int]) -> Generator[int, None, None]:
    for column in row:
        yield column

def cells(board: list[list[int]]) -> Generator[int, None, None]:
    for row in board:
        yield from columns(row)

for cell in cells(numbers_board):
    print(cell)
```

The program will print the numbers 1 through 9 again, but this time, the `cells` generator will use the `columns` subgenerator to generate the cells. The `yield from` statement allows the outer generator to transfer control to the inner generator and obtain values from it without having to iterate over each one. Although this may seem like an unnecessary addition in this simple example, it is included to demonstrate the use of a subgenerator.

With the information covered in the previous two chapters, you should now have a good understanding of the generators topic. The next section will explain why it is crucial to have a correct comprehension of how generators work.

## Use cases

Python's generators are definitely a unique aspect of the language that is, however, not used that frequently in the code. This is likely due to the fact that the default iteration and list comprehension syntax are sufficient in most cases. However, incorporating lazy iteration and other generator-related enhancements can sometimes be a game-changer in the codebase.

Despite their limited use in code, generators are essential when working with external libraries such as the FastAPI web framework or pytest testing library. To go through some examples, first, take a look at a class that mimics a database and is aware of its `connected` status:

```python
class Database:
    def __init__(self) -> None:
        self._entries: list[dict] = []
        self._connected = False

    def connect(self) -> None:
        self._connected = True

    def disconnect(self) -> None:
        self._connected = False

    def add(self, entry: dict) -> None:
        if self._connected is False:
            raise exceptions.DatabaseError("Database is disconnected")
        self._entries.append(entry)

    @property
    def entries(self) -> list[dict]:
        if self._connected is False:
            raise exceptions.DatabaseError("Database is disconnected")
        return self._entries
```

If you want to implement this class in a FastAPI example, it would appear as follows:

```python
from fastapi import FastAPI, APIRouter

from sigma_py.generators.utils import Database

app = FastAPI()
router = APIRouter()

@router.get("/entries")
async def get_entries() -> list[dict]:
    db = Database()
    db.connect()
    entries = db.entries
    db.disconnect()
    return entries
```

The issue in this case, is that you need to manually:

- initialize the database instance
- connect the database
- disconnect the database

FastAPI solves this problem by introducing a dependency system, that uses generators. Take a look at the enhanced version of the `get_entries` endpoint:

```python
from typing import Generator
from fastapi import FastAPI, APIRouter, Depends

from sigma_py.generators.utils import Database

app = FastAPI()
router = APIRouter()

def get_db() -> Generator[Database, None, None]:
    db = Database()
    db.connect()
    yield db
    db.disconnect()

@router.get("/entries")
async def get_entries(db: Database = Depends(get_db)) -> list[dict]:
    return db.entries
```

The `get_db` dependency is responsible for all database-related tasks, allowing the endpoint to focus on its intended logic. This dependency is a generator function that creates and connects to a database object, and disconnects it once the generator is exhausted. The framework handles the generator's mechanics behind the scenes.

When using pytest to write tests, a similar process occurs. The library also uses generators to create fixtures that resemble FastAPI dependencies:

```python
import pytest
from typing import Generator

from sigma_py.generators.utils import Database

@pytest.fixture
def db() -> Generator[Database, None, None]:
    db = Database()
    db.connect()
    yield db
    db._entries = []
    db.disconnect()


def test_add_entry(db: Database) -> None:
    assert db.entries == []
    db.add({"name": "Jon"})
    assert db.entries == [{"name": "Jon"}]
```

As you can see, pytest also leverages a decorator to create and initialize dependencies and add a tear-down code which is executed before the generator gets exhausted.

## Summary

Generators are a powerful feature in Python that enable efficient and flexible handling of data generation, iteration, and processing. They offer lazy evaluation, saving memory and enabling infinite sequences. Generators provide advantages such as improved memory utilization, enhanced code readability, and the ability to handle large or infinite data streams. Popular libraries like FastAPI, pytest, Django, TensorFlow, or asyncio utilize generators for dependency management, fixtures, pagination, batch processing, and asynchronous iteration respectively. By understanding and leveraging generators, you can optimize code, improve performance, and design modular and reusable solutions. Embrace generators to write efficient, readable, and scalable code in various domains.

## Sources

Code examples used in the article can be found here: [**link**](https://github.com/ttyobiwan/sigma_python).

The biggest inspiration for these articles and source of my knowledge is the [**Fluent Python**](https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/) book by Luciano Ramalho. I highly encourage you to check it out; you will not be disappointed.

Documentation page of each library:

- [FastAPI](https://fastapi.tiangolo.com/lo/)
- [pytest](https://docs.pytest.org/en/7.3.x/)
