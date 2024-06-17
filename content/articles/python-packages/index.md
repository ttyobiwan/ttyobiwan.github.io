---
title: "5 Python Must-Know Packages"
date: 2023-03-08
tags: ["python"]
---

Saying "you must know it" in pretty much any field of science can be quite contentious. There is no exception in software development. You may frequently see tweets or posts stating things like "you must learn Blockchain if you don't want to be left behind" or "you must know Kubernetes because it is so popular right now." Spoiler: You don't. However, if you want to be an expert in your field, there might be some topics that are almost universal or are used so frequently that it can be challenging without at least a fundamental understanding.

Python has gathered an incredibly strong community after over 30 years of its existence. As a result, Python has a plethora of well-known libraries and frameworks. Only by looking at the list of the [most popular backend frameworks](https://statisticsanddata.org/data/most-popular-backend-frameworks-2012-2023/), you can see 2 Python libraries - Django and Flask. Right behind the corner, there is also FastAPI, which, given its popularity, will probably overtake Flask. With numerous excellent libraries available, there must be at least a few that are universal, or ubiquitous enough to qualify as "must-knows".

## Managing linters with pre-commit

Writing code is, of course, a major part of software development. Fortunately, formatting and style maintenance are not a major part of writing the code. There are numerous tools that lint the code to ensure that it appears consistently throughout the project, and determine whether the style guide is being followed. You've probably seen or used at least one of these libraries:

- black
- flake8
- isort
- mypy
- ruff (recently, my favorite one)

Each of them has its own responsibilities, but in general, they are here to ensure that the code is properly styled and structured. The problem is that by default you need to install and run them separately and manually. This is time-consuming and suboptimal. Luckily, there is a tool for managing and running them all together: `pre-commit`.

As the name implies, the main idea behind `pre-commit` is to run your code checks right before you commit the code, so that changes can be made when it is not too late. However, the tool is more powerful than simply running x and y when a git commit occurs. It enables you to manage linters and checkers via a `.pre-commit-config.yaml` file rather than installing them as project dependencies. It handles caching installed tools as well as updating them. Here's an example of such a `yaml` file:

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: mixed-line-ending
      - id: check-json
      - id: check-toml
      - id: check-yaml

  - repo: https://github.com/psf/black
    rev: 22.12.0
    hooks:
      - id: black
        name: Black

  - repo: https://github.com/charliermarsh/ruff-pre-commit
    rev: v0.0.185
    hooks:
      - id: ruff
        name: Ruff
        args: ["--fix"]

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v0.991
    hooks:
      - id: mypy
        name: MyPy
        exclude: ^.*\b(migrations)\b.*$
        additional_dependencies: ["types-requests", "types-redis"]
```

All you have to do is specify which repositories (hooks) you want 'pre-commit' to install and run. There are four hooks visible here:

- Basic ones, provided by `pre-commit`, which address some of the common issues,
- `black` for code formatting,
- `ruff` for enforcing code style guide,
- `mypy` for static type checking.

`pre-commit` also enables you to add some extra arguments or dependencies for each hook, as seen in the `ruff` and `mypy` cases. All hooks can, of course, be further customized with a config file, such as `pyproject.toml`.

With `pre-commit` installed and `.pre-commit-config.yaml` in place, you should be able to run `pre-commit run --all-files` command which will install and run the hooks. Here is an example output:

```console
$ pre-commit run --all-files
trim trailing whitespace.................................................Passed
fix end of files.........................................................Passed
mixed line ending........................................................Passed
check json...............................................................Passed
check toml...............................................................Passed
check yaml...............................................................Passed
Black....................................................................Passed
Ruff.....................................................................Passed
MyPy.....................................................................Passed
```

All the checks passed, and you can now commit & push the code to the remote repository, without wasting money on failed CI checks.

## Writing tests using pytest

Tests are a must-know not only in Python but in software development in general. They verify that your code meets the functional requirements. They give you the assurance that you won't alter the working code. Unit tests are used to verify the smallest pieces of code, integration tests examine the integration with dependencies, and end-to-end tests check the complete processes.

`unittest` is a standard library in Python used for creating tests, providing both basic and advanced testing tools. However, relying solely on `unittest` may not be optimal in the long run as it may lead to a lot of redundant "util" code, a lack of suitable extensions, and difficulties in creating tests, ultimately limiting scalability. Fortunately, `pytest` is a popular testing framework that addresses these limitations and provides several benefits for developers.

`pytest` allows developers to focus on testing their code without writing any extraneous code that is irrelevant to the test. Unlike `unittest`, you don't need to create a `TestCase`-like class or manually mark the tests - `pytest` will automatically detect them. Additionally, you don't need to use specific assertion functions like `assertEqual` as `pytest` makes use of Python's built-in `assert` keyword. Lastly, `pytest` offers a more efficient and effective way of managing the setup and teardown dependencies through fixtures.

Fixtures are one of the most important `pytest` features. According to `pytest` [documentation](https://docs.pytest.org/en/7.1.x/index.html), fixtures are defined as follows:

> In testing, a fixture provides a defined, reliable and consistent context for the tests.

In practice, a fixture is written as a function that provides the necessary resources to make a test functional. For example, in web development, a common fixture is a database connection. When testing something that involves requests to the database, a fixture can be created that starts the connection, passes it to the test, and then cleans and closes the connection after the test is completed.

For the sake of simplicity consider a case of an in-memory database, that is aware of "being connected":

```python
from typing import Any
from must_knows import exceptions

class Database:
    """Simple, in-memory database."""

    def __init__(self) -> None:
        self._entries: list[Any] = []
        self._connected = False

    def connect(self) -> None:
        self._connected = True

    def disconnect(self) -> None:
        self._connected = False

    def add(self, entry: Any) -> None:
        if self._connected is False:
            raise exceptions.DatabaseError("Database is disconnected")
        self._entries.append(entry)

    @property
    def entries(self) -> list:
        if self._connected is False:
            raise exceptions.DatabaseError("Database is disconnected")
        return self._entries
```

This database will be utilized in a user service - a simple class that exposes only the most basic operations:

```python
import uuid
from dataclasses import dataclass
from must_knows import exceptions, database

@dataclass
class User:
    """User model."""

    id: uuid.UUID
    email: str
    password: str

class UserService:
    """User operations manager."""

    def __init__(self, db: database.Database) -> None:
        self.db = db

    def register(self, email: str, password1: str, password2: str) -> None:
        if password1 != password2:
            raise exceptions.ValidationError("Password must match")
        user = User(id=uuid.uuid4(), email=email, password=password1)
        self.db.add(user)

    def login(self, email: str, password: str) -> uuid.UUID:
        user = next((u for u in self.db.entries if u.email == email), None)
        if user is None or user.password != password:
            raise exceptions.LoginError("Invalid credentials")
        return user.id
```

If you were to test this class without using `pytest`, you would have to manually create the database object and execute the connect method for each test. Additionally, you would need to implement a teardown method that runs the disconnect method after each test. This process can become cumbersome, especially if the connect and disconnect methods take a longer time to execute or if there are failures that prevent the database from disconnecting properly. This is where fixtures come to the rescue:

```python
# tests/conftest.py
import pytest
from typing import Generator
from must_knows import database

@pytest.fixture()
def connected_db() -> Generator[database.Database, None, None]:
    """Yield connected database.

    Disconnect on teardown.
    """
    db = database.Database()
    db.connect()
    yield db
    db.disconnect()

# tests/test_user_service.py
from must_knows.main_dataclass import UserService

class TestUserService:
    """Test cases for the UserService class."""

    def test_register(self, connected_db):
        srv = UserService(db=connected_db)
        srv.register("test@user.com", "testpassword", "testpassword")
        uid = srv.login("test@user.com", "testpassword")
        assert uid is not None
```

To use fixtures in `pytest`, all you need to do is define them in the `conftest.py` file, and `pytest` will automatically recognize them by name, eliminating the need to import anything. One key aspect of fixtures is that they are structured as Python generators. The code before the yield statement is executed before the test, while the code after yield serves as the teardown, which runs after the test completes or if the test fails. This means that the test itself doesn't need to include any code related to the database connection, nor does it need to worry about the cleanup process after completion.

The `fixture` decorator also includes a scope parameter that specifies when the fixture should be initialized and torn down. By default, the scope is set to `function`, which implies the fixture is initialized and torn down before and after every test. However, you can modify this behavior by setting the scope to `session`, which ensures that the same database is utilized for all tests and is only disconnected once all tests are finished.

Another nice feature of `pytest` is the abundance of excellent plugins. One of the most popular is definitely `pytest-cov`, which computes test coverage and generates a report. It can afterward be used to detect untested code or to brag about the great quality of the tests (albeit high coverage does not always imply quality).

## Data structures with pydantic

Python is mostly used in data science and web development, but no matter what you want to accomplish with it, you will eventually need to parse and validate some data. Of course, you may start from scratch and implement everything, as you can in pretty much any circumstance. You can also use a `dataclass` module, a Python's builtin. Take a look at the class from the prior example:

```python
import uuid
from dataclasses import dataclass, asdict

@dataclass
class User:
    id: uuid.UUID
    email: str
    password: str

user = User(id=uuid.uuid4(), email="test@user.com", password="testpass")
user_dict = asdict(user)
```

Since implementing `__init__` function is no longer required, using the dataclass module is simple and reduces the need for extra code. A dataclass instance may also be easily transformed into a dictionary. Dataclasses might not be adequate, though, when more sophisticated functionality is needed. Several limitations are made clear even in this straightforward scenario.

First of all, no real validation is taking place. Even though a password should be a string, you may still use an integer and everything will work out. Not to mention the email field, which should take a genuine email address but may be filled with whatever you choose. Also, you often want the id field to be filled up automatically if nothing is provided. In this manner, the user service's "register" method wouldn't need to create the id. Such behavior is actually possible with the dataclasses:

```python
import uuid
from dataclasses import dataclass, field

@dataclass
class User:
    email: str
    password: str
    id: uuid.UUID = field(default_factory=uuid.uuid4)

user = User(email="test@user.com", password="testpass")
```

By using the `field` function and providing a factory to generate a default value, you can make the `id` field populate automatically when it is not provided. However, you may have noticed that the `id` field had to be moved to the end of the class. This is because, in dataclasses, fields with default values cannot appear before fields without default values. While this may seem like a minor inconvenience, it can become frustrating when dealing with longer classes where you want to group values together in a more meaningful way. The `pydantic` package offers a more powerful solution to help you deal with data structures.

`pydantic` is a library whose main purpose is data parsing and validation. It is much more powerful than dataclasses, though. With `pydantic`, you construct a new model using a `BaseModel` class and then specify the fields with type hints:

```python
import uuid
from pydantic import BaseModel, EmailStr, Field

class User(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4())
    email: EmailStr
    password: str = Field(min_length=8, max_length=32)

user = User(email="test@user.com", password="testpass")
user_dict = user.dict()
```

Upon closer inspection, you'll notice that `pydantic` operates quite differently. Firstly, unlike with dataclasses, you can place the `id` field at the beginning of the class without any issues. Similar to dataclasses, `pydantic` offers a `Field` function that allows you to configure individual fields. Additionally, `pydantic` provides extra types that can be used to validate input. In this example, the `EmailStr` type is utilized to ensure that the email field is a valid email address. While your IDE may prefer `email=EmailStr("`[`test@user.com`](mailto:test@user.com)`")`, instead of the `email="`[`test@user.com`](mailto:test@user.com)`"`, `pydantic` can handle both cases seamlessly. Finally, `pydantic` validates not only the default types but also any constraints specified in the `Field` function. For instance, in this example, the password field must be a string between 8 and 32 characters in length, effectively disallowing anything else.

Furthermore, `pydantic` allows you to quickly add your own validators. Recall the `register` method once again. It would only create a user if the passwords were the same. Although this logic fits well in the `register` method, it may alternatively be placed in the user model:

```python
import uuid
from pydantic import BaseModel, EmailStr, root_validator, Field
from must_knows import database

class User(BaseModel):
	"""User model."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    email: EmailStr
    password: str = Field(min_length=8, max_length=32)
    password_confirmation: str

    @root_validator(pre=True)
    def validate_passwords(cls, values: dict) -> dict:
        if values["password"] != values["password_confirmation"]:
            raise ValueError("Passwords must match")
        return values
  
class UserSerivce:
    """User operations manager."""
    
    def __init__(self, db: database.Database) -> None:
        self.db = db

    def register(self, email: EmailStr, password1: str, password2: str) -> None:
        user = User(email=email, password=password1, password_confirmation=password2)
        self.db.add(user)
```

This way, `pydantic` first checks if the passwords match, and then if the `password` field matches the initial criteria, i.e., it has to be a string with a valid length. You can also write validators for a specific field only using the `validator` decorator. However, in this case, validity depended on two fields simultaneously, which is why the `root_validator` was used - because it has access to all values. If you want to read more about validators or how powerful `pydantic` is in general, be sure to check out the [official documentation](https://docs.pydantic.dev/) - it's just as great as the library itself.

## Better requests using httpx

Regardless of what software you are building, you will likely end up doing some requests. The essential capabilities for dealing with external APIs are provided by the standard Python `requests` module. Nevertheless, it does not support a number of essential Python features.

`httpx` is a modern, alternative HTTP client for Python, which offers a more intuitive and user-friendly API than the standard `requests` library. The most significant feature of `httpx` is its async support. It can handle HTTP requests asynchronously, which is beneficial for making several requests at the same time without blocking the main thread. This functionality can improve the performance of applications that require high network I/O. `httpx` is also built on top of the standard Python `typing` module, which allows for better code readability and clarity.

`httpx` provides an elegant and straightforward API to make HTTP requests:

```python
import asyncio
from httpx import AsyncClient

async def main() -> None:
    client = AsyncClient(base_url="https://pokeapi.co/api/v2")

    # Two calls, one after another
    r1 = await client.get("/pokemon/ditto")
    print(f"r1: {r1.status_code}")  # 200
    # You can use 'request' for better configurability
    r2 = await client.request("GET", "/pokemon/jynx")
    print(f"r2: {r2.status_code}")  # 200

    # Two calls made asynchronously
    r3, r4 = await asyncio.gather(
        client.get("/pokemon/lucario"),
        client.get("/pokemon/snorlax"),
    )
    print(f"r3: {r3.status_code}")  # 200
    print(f"r4: {r4.status_code}")  # 200

    # Call resulting in 404 and raising an 'HTTPStatusError'
    r5 = await client.get("/pokemon/john-wick")
    print(f"r5: {r5.status_code}")  # 404
    r5.raise_for_status()

if __name__ == "__main__":
    asyncio.run(main())
```

The preceding example is clearly quite simple, but what's also great about `httpx` is how easily configurable it is. This includes headers, cookies, authentication, and other request parameters:

```python
async def configurability_example() -> None:
    client = AsyncClient(
        base_url="https://pokeapi.co/api/v2",
        auth=("ash", "ketchum123"),
        cookies={"access_token": "Bearer PIKACHU"},
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )

    # All requests share the same configuration
    await client.get("/pokemon/ditto")
    await client.request("GET", "/pokemon/jynx")
    await client.get("/pokemon/snorlax")
```

All of this makes `httpx` an easy and powerful way for Python scripts to interact with the APIs.

## Dynamic HTML with Jinja

As previously mentioned, Python is primarily used for data science and backend development, which means that frontend tasks are rarely performed within Python scripts. However, there are common scenarios where a little bit of frontend functionality is needed in a backend task. A good example can be email notifications, where you want to notify a user when something occurs on the backend and include details about the event in the email. In most cases, it's desirable to use HTML format for the email, allowing for structured and styled content.

To address this need, `Jinja` was created by Armin Ronacher, the creator of `Flask` and `click`. `Jinja` is a templating engine that allows for working with HTML files in Python scripts. However, the capabilities of `Jinja` go beyond simple file manipulation - it's a powerful tool for creating dynamic HTML content in a Python environment.

One of the primary benefits of using `Jinja` is the ability to use templates. Templates allow you to design a structure for your HTML files that may be reused. This is especially beneficial if you have a consistent layout for different emails or web pages.

To use `Jinja`, you first need to define a template. This is usually an HTML file with some placeholders for the dynamic content. For example, you could have a template for a simple email like this:

```html
<html>

<body>
    <h1>{{title}}</h1>
    <p>{{content}}</p>
</body>

</html>
```

In this template, `{{title}}` and `{{content}}` are placeholders that will be replaced with actual values at runtime. To render the template, you need to create a `Jinja` environment and load the template from a file:

```python
from jinja2 import Environment, FileSystemLoader
  
env = Environment(loader=FileSystemLoader("must_knows/templates/"))

template = env.get_template("example.html")
data = {"title": "Hello", "content": "World!"}
html = template.render(data)
print(html)
```

In the example above, the `FileSystemLoader` is used to load templates from the `templates` directory. Once you have the environment and the template, you can render it with some data. The `render` method replaces the placeholders in the template with the values from the `data` dictionary and returns the rendered HTML.

Another useful feature is the ability to establish "base" templates that may be extended by more customized templates. In this manner, you may put shared code in the base template and reuse it in all templates. Then you simply provide the blocks that will be injected into particular templates:

```xml
<!-- base.html -->
<html>

<body>
    <h1>{% block title %}{% endblock %}</h1>
    
    <p>{% block content %}{% endblock %}</p>
    
    <footer>{% block footer %}Made using @Jinja{% endblock %}</footer>
</body>

</html>

<!-- extended_example.html -->
{% extends "base.html" %}

{% block title %}{{title}}{% endblock %}

{% block content %}{{content}}{% endblock %}
```

Of course, `Jinja` is considerably more powerful than merely changing placeholders. You may build intricate templates with conditionals, loops, macros, and filters to suit a variety of use situations. Also, it works nicely with `Django` and `Flask`, two other Python web frameworks. The most common use cases include generating reports and emails, but it can even be used for building web pages.

## Summary

Python is a versatile and user-friendly language that offers a wealth of libraries for virtually any type of use case. Identifying packages that are considered "must-know" might, however, be challenging. Backend developers might recommend `Flask` or `FastAPI`, while data scientists would suggest `Tensorflow` or `pandas`. While these packages are undoubtedly valuable in their respective fields, they may not be suitable for everyone. Presented packages are just a small fraction of the countless packages available in the Python ecosystem, but they are among the most important and extensively used. By learning and mastering these packages, you can become a more proficient Python developer, regardless of your field.

## Sources

Code examples used in the article can be found here: [link](https://github.com/ttobiwan/must_knows_py).

Documentation page of each library:

- [pre-commit](https://pre-commit.com/)
- [pytest](https://docs.pytest.org/en/7.2.x/)
- [pydantic](https://docs.pydantic.dev/)
- [httpx](https://www.python-httpx.org/)
- [Jinja](https://jinja.palletsprojects.com/en/3.1.x/)
