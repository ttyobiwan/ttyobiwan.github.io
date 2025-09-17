---
title: "Patterns and Practices for using SQLAlchemy 2.0 with FastAPI"
date: 2023-06-15
tags: ["python"]
showAuthor: false
authors:
  - "piotr"
---

While Django and Flask remain the first choices for many Python engineers, **FastAPI** has already been recognized as an undeniably reliable pick. It is a highly flexible, well-optimized, structured framework that gives the developer endless possibilities for building backend applications.

Working with databases is an essential aspect of most backend applications. As a result, the ORM plays a critical role in the backend code. However, unlike Django, FastAPI does not have an ORM built-in. It is entirely the developer's responsibility to select a suitable library and integrate it into the codebase.

Python engineers widely consider **SQLAlchemy** to be the most popular ORM available. It's a legendary library that's been in use since 2006 and has been adopted by thousands of projects. In 2023, it received a major update to version 2.0. Similar to FastAPI, SQLAlchemy provides developers with powerful features and utilities without forcing them to use them in a specific way. Essentially, it's a versatile toolkit that empowers developers to use it however they see fit.

FastAPI and SQLAlchemy are a match made in heaven. They are both reliable, performant, and modern technologies, which enable the creation of powerful and unique applications. This article explores creating a FastAPI backend application that utilizes SQLAlchemy 2.0 as the ORM. The content covers:

- building models using `Mapped` and `mapped_column`
- defining an abstract model
- handling database session
- using the ORM
- creating a common repository class for all models
- preparing a test setup and adding tests

Afterward, you will be able to combine the FastAPI application with SQLAlchemy ORM easily. Additionally, you will get familiar with best practices and patterns for creating well-structured, robust, and performant applications.

## Prerequisites

Code examples included in the article come from the **_alchemist_** project, which is a basic API for creating and reading ingredient and potion objects. The main focus of the article is to explore the combination of FastAPI and SQLAlchemy. It doesn't cover other topics, such as:

- configuring Docker setup
- starting the uvicorn server
- setting up linting

If you are interested in these topics, you can explore them on your own by examining the codebase. To access the code repository of the alchemist project, please follow this link [here](https://github.com/ttyobiwan/alchemist). Additionally, you can find the file structure of the project below:

```plaintext
alchemist
├─ alchemist
│  ├─ api
│  │  ├─ v1
│  │  │  ├─ __init__.py
│  │  │  └─ routes.py
│  │  ├─ v2
│  │  │  ├─ __init__.py
│  │  │  ├─ dependencies.py
│  │  │  └─ routes.py
│  │  ├─ __init__.py
│  │  └─ models.py
│  ├─ database
│  │  ├─ __init__.py
│  │  ├─ models.py
│  │  ├─ repository.py
│  │  └─ session.py
│  ├─ __init__.py
│  ├─ app.py
│  └─ config.py
├─ requirements
│  ├─ base.txt
│  └─ dev.txt
├─ scripts
│  ├─ create_test_db.sh
│  ├─ migrate.py
│  └─ run.sh
├─ tests
│  ├─ conftest.py
│  └─ test_api.py
├─ .env
├─ .gitignore
├─ .pre-commit-config.yaml
├─ Dockerfile
├─ Makefile
├─ README.md
├─ docker-compose.yaml
├─ example.env
└─ pyproject.toml
```

Although the tree may seem large, some of the contents are not relevant to the main point of this article. Additionally, the code may appear simpler than what is necessary in certain areas. For instance, the project lacks:

- production stage in the Dockerfile
- alembic setup for migrations
- subdirectories for tests

This was done intentionally to reduce complexity and avoid unnecessary overhead. However, it is important to keep these factors in mind if dealing with a more production-ready project.

## API requirements

When beginning to develop an app, it's critical to consider the models that your app will use. These models will represent the **objects** and **entities** that your app will work with and will be exposed in the API. In the case of the alchemist app, there are two entities: ingredients and potions. The API should allow for creating, and retrieving these entities. The `alchemist/api/models.py` file contains the models that will be used in the API:

```python
import uuid

from pydantic import BaseModel, Field


class Ingredient(BaseModel):
    """Ingredient model."""

    pk: uuid.UUID
    name: str

    class Config:
        orm_mode = True


class IngredientPayload(BaseModel):
    """Ingredient payload model."""

    name: str = Field(min_length=1, max_length=127)


class Potion(BaseModel):
    """Potion model."""

    pk: uuid.UUID
    name: str
    ingredients: list[Ingredient]

    class Config:
        orm_mode = True


class PotionPayload(BaseModel):
    """Potion payload model."""

    name: str = Field(min_length=1, max_length=127)
    ingredients: list[uuid.UUID] = Field(min_items=1)
```

The API will be returning `Ingredient` and `Potion` models. Setting `orm_mode` to `True` in the configuration will make it easier to work with the SQLAlchemy objects in the future. `Payload` models will be utilized for creating new objects.

The use of pydantic makes the classes more detailed and clear in their roles and functions. Now, it's time to create the database models.

## Declaring models

A model is essentially a **representation** of something. In the context of APIs, models represent what the backend expects in the request body and what it will return in the response data. Database models, on the other hand, are more complex and represent the **data structures** stored in the database and the **relationship** types between them.

The `alchemist/database/models.py` file contains models for ingredient and potion objects:

```python
import uuid

from sqlalchemy import Column, ForeignKey, Table, orm
from sqlalchemy.dialects.postgresql import UUID


class Base(orm.DeclarativeBase):
    """Base database model."""

    pk: orm.Mapped[uuid.UUID] = orm.mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )


potion_ingredient_association = Table(
    "potion_ingredient",
    Base.metadata,
    Column("potion_id", UUID(as_uuid=True), ForeignKey("potion.pk")),
    Column("ingredient_id", UUID(as_uuid=True), ForeignKey("ingredient.pk")),
)


class Ingredient(Base):
    """Ingredient database model."""

    __tablename__ = "ingredient"

    name: orm.Mapped[str]


class Potion(Base):
    """Potion database model."""

    __tablename__ = "potion"

    name: orm.Mapped[str]
    ingredients: orm.Mapped[list["Ingredient"]] = orm.relationship(
        secondary=potion_ingredient_association,
        backref="potions",
        lazy="selectin",
    )
```

Every model in SQLAlchemy starts with the `DeclarativeBase` class. Inheriting from it allows building database models that are compatible with Python type checkers.

It's also a good practice to create an **abstract** model—`Base` class in this case—that includes fields required in all models. These fields include the primary key, which is a unique identifier of every object. The abstract model often also stores the creation and update dates of an object, which are set automatically, when an object is created or updated. However, the `Base` model will be kept simple.

Moving on to the `Ingredient` model, the `__tablename__` attribute specifies the name of the database table, while the `name` field uses the new SQLAlchemy syntax, allowing model fields to be declared with type annotations. This concise and modern approach is both powerful and advantageous for type checkers and IDEs, as it recognizes the `name` field as a string.

Things get more complex in the `Potion` model. It also includes `__tablename__` and `name` attributes, but on top of that, it stores the relationship to ingredients. The use of `Mapped[list["Ingredient"]]` indicates that the potion can contain multiple ingredients, and in this case, the relationship is many-to-many (M2M). This means that a single ingredient can be assigned to multiple potions.

M2M requires additional configuration, usually involving the creation of an association table that stores the connections between the two entities. In this case, the `potion_ingredient_association` object stores only the identifiers of the ingredient and potion, but it could also include extra attributes, such as the amount of a specific ingredient needed for the potion.

The `relationship` function configures the relationship between the potion and its ingredients. The `lazy` argument specifies how related items should be loaded. In other words: what should SQLAlchemy do with related ingredients when you are fetching a potion. Setting it to `selectin` means that ingredients will be loaded with the potion, eliminating the need for additional queries in the code.

Building well-designed models is crucial when working with an ORM. Once this is done, the next step is establishing the connection with the database.

## Session handler

When working with a database, particularly when using SQLAlchemy, it is essential to understand the following concepts:

- dialect
- engine
- connection
- connection pool
- session

Out of all these terms, the most important one is the _**engine**_. According to the SQLAlchemy documentation, the engine object is responsible for connecting the `Pool` and `Dialect` to facilitate database connectivity and behavior. In simpler terms, the engine object is the source of the database connection, while the _**connection**_ provides high-level functionalities like executing SQL statements, managing transactions, and retrieving results from the database.

A _**session**_ is a unit of work that groups related operations within a single transaction. It is an abstraction over the underlying database connections and efficiently manages connections and transactional behavior.

_**Dialect**_ is a component that provides support for a specific database backend. It acts as an intermediary between SQLAlchemy and the database, handling the details of communication. The alchemist project uses Postgres as the database, so the dialect must be compatible with this specific database type.

The final question mark is the _**connection pool**_. In the context of SQLAlchemy, a connection pool is a mechanism that manages a collection of database connections. It is designed to improve the performance and efficiency of database operations by reusing existing connections rather than creating new ones for each request. By reusing connections, the connection pool reduces the overhead of establishing new connections and tearing them down, resulting in improved performance.

With that knowledge covered, you can now take a look at `alchemist/database/session.py` file, which contains a function that will be used as a dependency for connecting to the database:

```python
from collections.abc import AsyncGenerator

from sqlalchemy import exc
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from alchemist.config import settings


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine(settings.DATABASE_URL)
    factory = async_sessionmaker(engine)
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except exc.SQLAlchemyError as error:
            await session.rollback()
            raise
```

The first important detail to notice is that the function `get_db_session` is a generator function. This is because the FastAPI dependency system supports generators. As a result, this function can handle both successful and failed scenarios.

The first two lines of the `get_db_session` function create a database engine and a session. However, the session object can also be used as a context manager. This gives you more control over potential exceptions and successful outcomes.

Although SQLAlchemy handles the closing of connections, it is a good practice to explicitly declare how to handle the connection after it's done. In the `get_db_session` function, the session is committed if everything goes well and rolled back if an exception is raised.

It's important to note that this code is built around the asyncio extension. This feature of SQLAlchemy allows the app to interact with the database asynchronously. It means that requests to the database won't block other API requests, making the app way more efficient.

Once the models and connection are set up, the next step is to ensure that the models are added to the database.

## Quick migrations

SQLAlchemy models represent the structures of a database. However, simply creating them does not result in immediate changes to the database. To make changes, you must first _**apply**_ them. This is typically done using a migration library such as alembic, which tracks every model and updates the database accordingly.

Since no further changes to the models are planned in this scenario, a basic migration script will suffice. Below is an example code from the `scripts/migrate.py` file.

```python
import asyncio
import logging

from sqlalchemy.ext.asyncio import create_async_engine

from alchemist.config import settings
from alchemist.database.models import Base

logger = logging.getLogger()


async def migrate_tables() -> None:
    logger.info("Starting to migrate")

    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Done migrating")


if __name__ == "__main__":
    asyncio.run(migrate_tables())
```

To put it simply, the `migrate_tables` function reads the structure of models and recreates it in the database using the SQLAlchemy engine. To run this script, use the `python scripts/migrate.py` command.

The models are now present both in the code and in the database and `get_db_session` can facilitate interactions with the database. You can now begin working on the API logic.

## API with the ORM

As mentioned previously, the API for ingredients and potions is meant to support three operations:

- creating objects
- listing objects
- retrieving objects by ID

Thanks to the prior preparations, all these features can already be implemented with SQLAlchemy as the ORM and FastAPI as the web framework. To begin, review the ingredients API located in the `alchemist/api/v1/routes.py` file.

```python
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from alchemist.api import models
from alchemist.database import models as db_models
from alchemist.database.session import get_db_session

router = APIRouter(prefix="/v1", tags=["v1"])


@router.post("/ingredients", status_code=status.HTTP_201_CREATED)
async def create_ingredient(
    data: models.IngredientPayload,
    session: AsyncSession = Depends(get_db_session),
) -> models.Ingredient:
    ingredient = db_models.Ingredient(**data.dict())
    session.add(ingredient)
    await session.commit()
    await session.refresh(ingredient)
    return models.Ingredient.from_orm(ingredient)


@router.get("/ingredients", status_code=status.HTTP_200_OK)
async def get_ingredients(
    session: AsyncSession = Depends(get_db_session),
) -> list[models.Ingredient]:
    ingredients = await session.scalars(select(db_models.Ingredient))
    return [models.Ingredient.from_orm(ingredient) for ingredient in ingredients]


@router.get("/ingredients/{pk}", status_code=status.HTTP_200_OK)
async def get_ingredient(
    pk: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
) -> models.Ingredient:
    ingredient = await session.get(db_models.Ingredient, pk)
    if ingredient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ingredient does not exist",
        )
    return models.Ingredient.from_orm(ingredient)
```

Under the `/ingredients` API, there are three routes available. The POST endpoint takes an ingredient payload as an object from a previously created model and a database session. The `get_db_session` generator function initializes the session and enables database interactions.

In the actual function body, there are five steps taking place:

1. An ingredient object is created from the incoming payload.
2. The `add` method of the session object adds the ingredient object to the session tracking system and marks it as pending for insertion into the database.
3. The session is committed.
4. The ingredient object is refreshed to ensure its attributes match the database state.
5. The database ingredient instance is converted to the API model instance using the `from_orm` method.

For a quick test, a simple curl can be executed against the running app:

```bash
curl -X 'POST' \
  'http://localhost:8000/api/v1/ingredients' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{"name": "Salty water"}'
```

In the response, there should be an ingredient object that has an ID coming from the database:

```json
{
  "pk":"2eb255e9-2172-4c75-9b29-615090e3250d",
  "name":"Salty water"
}
```

Although SQLAlchemy's multiple layers of abstraction may seem unnecessary for a simple API, they keep the ORM details separated and contribute to SQLAlchemy's efficiency and scalability. When combined with asyncio, the ORM features perform exceptionally well in the API.

The remaining two endpoints are less complex and share similarities. One part that deserves a deeper explanation is the use of the `scalars` method inside the `get_ingredients` function. While querying the database using SQLAlchemy, the `execute` method is often used with a query as the argument. While `execute` method returns row-like tuples, `scalars` returns ORM entities directly, making the endpoint cleaner.

Now, consider the potions API, in the same file:

```python
@router.post("/potions", status_code=status.HTTP_201_CREATED)
async def create_potion(
    data: models.PotionPayload,
    session: AsyncSession = Depends(get_db_session),
) -> models.Potion:
    data_dict = data.dict()
    ingredients = await session.scalars(
        select(db_models.Ingredient).where(
            db_models.Ingredient.pk.in_(data_dict.pop("ingredients"))
        )
    )
    potion = db_models.Potion(**data_dict, ingredients=list(ingredients))
    session.add(potion)
    await session.commit()
    await session.refresh(potion)
    return models.Potion.from_orm(potion)


@router.get("/potions", status_code=status.HTTP_200_OK)
async def get_potions(
    session: AsyncSession = Depends(get_db_session),
) -> list[models.Potion]:
    potions = await session.scalars(select(db_models.Potion))
    return [models.Potion.from_orm(potion) for potion in potions]


@router.get("/potions/{pk}", status_code=status.HTTP_200_OK)
async def get_potion(
    pk: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
) -> models.Potion:
    potion = await session.get(db_models.Potion, pk)
    if potion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Potion does not exist",
        )
    return models.Potion.from_orm(potion)
```

The GET endpoints for potions are identical to those for ingredients. However, the POST function requires additional code. This is because creating potions involves including at least one ingredient ID, which means that the ingredients must be fetched and linked to the newly created potion. To achieve this, the `scalars` method is used again, but this time with a query that specifies the IDs of the fetched ingredients. The remaining part of the potion creation process is identical to that of the ingredients.

To test the endpoint, again a curl command can be executed.

```bash
curl -X 'POST' \
  'http://localhost:8000/api/v1/potions' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{"name": "Salty soup", "ingredients": ["0b4f1de5-e780-418d-a74d-927afe8ac954"}'
```

It results in the following response:

```json
{
  "pk": "d4929197-3998-4234-a5f7-917dc4bba421",
  "name": "Salty soup",
  "ingredients": [
    {
      "pk": "0b4f1de5-e780-418d-a74d-927afe8ac954",
      "name": "Salty water"
    }
  ]
}
```

It's important to notice that each ingredient is represented as a complete object within the potion, thanks to the `lazy="selectin"` argument specified in the relationship.

The APIs are functional, but there is a major issue with the code. While SQLAlchemy gives you the freedom to interact with the database as you please, it does not offer any high-level "manager" utility similar to Django's `Model.objects`. As a result, you will need to create it yourself, which is essentially the logic used in the ingredient and potion APIs. However, if you keep this logic directly in the endpoints without extracting it into a separate space, you will end up with a lot of duplicated code. Additionally, making changes to the queries or models will become increasingly difficult to manage.

The upcoming chapter introduces the repository pattern: an elegant solution for extracting ORM code.

## Repository

The _**repository**_ pattern allows to abstract away the details of working with the database. In the case of using SQLAlchemy, such as in the example of the alchemist, the repository class would be responsible for managing multiple models and interacting with the database session.

Take a look at the following code from the `alchemist/database/repository.py` file:

```python
import uuid
from typing import Generic, TypeVar

from sqlalchemy import BinaryExpression, select
from sqlalchemy.ext.asyncio import AsyncSession

from alchemist.database import models

Model = TypeVar("Model", bound=models.Base)


class DatabaseRepository(Generic[Model]):
    """Repository for performing database queries."""

    def __init__(self, model: type[Model], session: AsyncSession) -> None:
        self.model = model
        self.session = session

    async def create(self, data: dict) -> Model:
        instance = self.model(**data)
        self.session.add(instance)
        await self.session.commit()
        await self.session.refresh(instance)
        return instance

    async def get(self, pk: uuid.UUID) -> Model | None:
        return await self.session.get(self.model, pk)

    async def filter(
        self,
        *expressions: BinaryExpression,
    ) -> list[Model]:
        query = select(self.model)
        if expressions:
            query = query.where(*expressions)
        return list(await self.session.scalars(query))
```

The `DatabaseRepository` class holds all the logic that was previously included in the endpoints. The difference is that it allows for the specific model class to be passed in the `__init__` method, making it possible to reuse the code for all models instead of duplicating it in each endpoint.

Furthermore, the `DatabaseRepository` uses Python generics, with the `Model` generic type bounded to the abstract database model. This allows for the repository class to benefit more from static type checking. When used with a specific model, the return types of the repository methods will reflect this specific model.

Because the repository needs to use the database session, it must be initialized along with the `get_db_session` dependency. Consider the new dependency in the `alchemist/api/v2/dependencies.py` file.

```python
from collections.abc import Callable

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from alchemist.database import models, repository, session


def get_repository(
    model: type[models.Base],
) -> Callable[[AsyncSession], repository.DatabaseRepository]:
    def func(session: AsyncSession = Depends(session.get_db_session)):
        return repository.DatabaseRepository(model, session)

    return func
```

Simply put, the `get_repository` function is a dependency factory. It first takes the database model that you will use the repository with. Then, it returns the dependency, which will be used to receive the database session and initialize the repository object. To gain a better understanding, check out the new API from the `alchemist/api/v2/routes.py` file. It shows only the POST endpoints, but it should be enough to give you a clearer idea of how the code gets improved:

```python
from typing import Annotated

from fastapi import APIRouter, Depends, status

from alchemist.api import models
from alchemist.api.v2.dependencies import get_repository
from alchemist.database import models as db_models
from alchemist.database.repository import DatabaseRepository

router = APIRouter(prefix="/v2", tags=["v2"])

IngredientRepository = Annotated[
    DatabaseRepository[db_models.Ingredient],
    Depends(get_repository(db_models.Ingredient)),
]
PotionRepository = Annotated[
    DatabaseRepository[db_models.Potion],
    Depends(get_repository(db_models.Potion)),
]


@router.post("/ingredients", status_code=status.HTTP_201_CREATED)
async def create_ingredient(
    data: models.IngredientPayload,
    repository: IngredientRepository,
) -> models.Ingredient:
    ingredient = await repository.create(data.dict())
    return models.Ingredient.from_orm(ingredient)


@router.post("/potions", status_code=status.HTTP_201_CREATED)
async def create_potion(
    data: models.PotionPayload,
    ingredient_repository: IngredientRepository,
    potion_repository: PotionRepository,
) -> models.Potion:
    data_dict = data.dict()
    ingredients = await ingredient_repository.filter(
        db_models.Ingredient.pk.in_(data_dict.pop("ingredients"))
    )
    potion = await potion_repository.create({**data_dict, "ingredients": ingredients})
    return models.Potion.from_orm(potion)
```

The first important feature to note is the use of `Annotated`, a new way of working with FastAPI dependencies. By specifying the dependency's return type as `DatabaseRepository[db_models.Ingredient]` and declaring its usage with `Depends(get_repository(db_models.Ingredient))` you can end up using simple type annotations in the endpoint: `repository: IngredientRepository`.

Thanks to the repository, the endpoints don't have to store all the ORM-related burden. Even in the more complicated potion case, all you need to do is to use two repositories at the same time.

You may wonder if initializing two repositories will initialize the session twice. The answer is no. FastAPI dependency system caches the same dependency calls in a single request. This means that session initialization gets cached and both repositories use the exact same session object. Yet another great feature of the combination of SQLAlchemy and FastAPI.

The API is fully functional and has a reusable, high-performing data-access layer. The next step is to make sure the requirements are met by writing some end-to-end tests.

## Testing

Tests play a crucial role in software development. Projects can contain unit, integration, and end-to-end (E2E) tests. While it is usually best to have a high number of meaningful unit tests, it is also good to write at least a few E2E tests to ensure the entire workflow is functioning correctly.

To create some E2E tests for the alchemist app, two additional libraries are required:

- pytest to actually create and run the tests
- httpx to make async requests inside the tests

Once these are installed, the next step is to have a separate, test database in place. You don't want your default database to be polluted or dropped. Since alchemist includes a Docker setup, only a simple script is needed to create a second database. Take a look at the code from the `scripts/create_test_db.sh` file:

```bash
#!/bin/bash

psql -U postgres
psql -c "CREATE DATABASE test"
```

In order for the script to be executed, it must be added as a volume to the Postgres container. This can be achieved by including it in the `volumes` section of the `docker-compose.yaml` file.

The final step of preparation is to create pytest fixtures within the `tests/conftest.py` file:

```python
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from alchemist.app import app
from alchemist.config import settings
from alchemist.database.models import Base
from alchemist.database.session import get_db_session


@pytest_asyncio.fixture()
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Start a test database session."""
    db_name = settings.DATABASE_URL.split("/")[-1]
    db_url = settings.DATABASE_URL.replace(f"/{db_name}", "/test")

    engine = create_async_engine(db_url)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    session = async_sessionmaker(engine)()
    yield session
    await session.close()


@pytest.fixture()
def test_app(db_session: AsyncSession) -> FastAPI:
    """Create a test app with overridden dependencies."""
    app.dependency_overrides[get_db_session] = lambda: db_session
    return app


@pytest_asyncio.fixture()
async def client(test_app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    """Create an http client."""
    async with AsyncClient(app=test_app, base_url="http://test") as client:
        yield client
```

One thing that is essential to be changed in the tests, is how the app interacts with the database. This includes not only changing the database URL but also ensuring that each test is isolated by starting with an empty database.

The `db_session` fixture accomplishes both of these goals. Its body takes the following steps:

1. Create an engine with a modified database URL.
2. Delete all existing tables to make sure that the test has a clean database.
3. Create all the tables inside the database (same code as in the migration script).
4. Create and yield a session object.
5. Manually close the session when the test is done.

Although the last step could also be implemented as a context manager, manual closing works just fine in this case.

The two remaining fixtures should be quite self-explanatory:

- `test_app` is the FastAPI instance from the `alchemist/app.py` file, with the `get_db_session` dependency replaced with the `db_session` fixture
- `client` is the httpx `AsyncClient` that will make API requests against the `test_app`

With all this being set up, finally the actual tests can be written. For conciseness, the example below from the `tests/test_api.py` file shows only a test for creating an ingredient:

```python
from fastapi import status


class TestIngredientsAPI:
    """Test cases for the ingredients API."""

    async def test_create_ingredient(self, client):
        response = await client.post("/api/v2/ingredients", json={"name": "Carrot"})
        assert response.status_code == status.HTTP_201_CREATED
        pk = response.json().get("pk")
        assert pk is not None

        response = await client.get("/api/v2/ingredients")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 1
        assert response.json()[0]["pk"] == pk
```

The test uses a client object created in a fixture, that makes requests to the FastAPI instance with overridden dependency. As a result, the test is able to interact with a separate database that will be cleared after the test is done. The structure of the remaining test suite for both APIs is pretty much the same.

## Summary

FastAPI and SQLAlchemy are excellent technologies for creating modern and powerful backend applications. The freedom, simplicity, and flexibility they offer make them one of the best options for Python-based projects. If developers follow best practices and patterns, they can create performant, robust, and well-structured applications that handle database operations and API logic with ease. This article aimed to provide you with a good understanding of how to set up and maintain this amazing combination.

## Sources

The source code for the alchemist project can be found here:

{{< github repo="ttyobiwan/alchemist" >}}
