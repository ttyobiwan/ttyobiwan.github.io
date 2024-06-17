---
title: "Practical Introduction to Domain-Driven Design"
date: 2023-02-28
tags: ["ddd"]
---

It should not be innovative to say that writing software is not merely about writing code - it is about solving a particular problem. Even though it's developers who eventually implement the solution, it is not developers who define what is the problem in the first place. That task is carried out by various business people, who consider processes, risks, and outcomes to describe what the problem is, why it exists, and how it should be addressed. In a domain-driven context, these business people are referred to as _Domain Experts_.

From an engineering perspective, it appears that Domain Experts hold a valuable asset: their knowledge about the domain. However, this knowledge is rarely shared in its raw form. Instead, it's usually translated into requirements so that developers can understand and implement it. The issue with this approach is that the domain knowledge of business people and developers can diverge. This means that the perspectives of those who define the problem and those who work on solving it may not align, leading to misunderstandings and conflicts.

So, what's the way out? Make sure that business and technical people use the same language and terminology.

## What is Domain-Driven Design?

Domain-Driven Design (DDD) is a methodology that emphasizes the importance of creating a shared understanding between domain experts and technical stakeholders and aligning the software solution with the underlying business requirements. This appears to be a high-level, non-technical definition, but it can also be broken down into something more developer-friendly:

> DDD is representing real-world concepts in the code, and its structure by cultivating and using ubiquitous language, that is built by modeling the business domain.

There is still some terminology to be introduced, so it might not be 100% clear right now. What's most important is that DDD provides tools and activities that allow writing and structuring code that is aligned with the business vision. It is then not only about communication but also about making design decisions, that actually shape the common language.

## Terminology

It should come as no surprise that the most important term in the DDD world is the _Domain_. Here is how Vlad Khononov, author of "Learning Domain-Driven Design" describes it:

> A business domain defines a company's main area of activity.

It means that the business domain could also be considered as:

- The main source of a company's revenue,
- What the company is best known for,
- Anything that the company does better than its competitors.

The domain can also be divided into _subdomains_ - more specific ranges of activities. While there are three different types of subdomains, the most important one is the _core_. It describes how the company achieves the business advantage. The other two are about more common, generic problems, like authentication systems or internal admin panels.

Having a deep understanding of a company's business domain is absolutely crucial for fully utilizing the benefits of Domain-Driven Design. The best source of this understanding is no one else than the _Domain Experts_. These are the individuals whose problem is being addressed with the software - stakeholders, various business people, and even users. It is not to say that engineers are uninformed about the domain they are working on, but rather that the Experts are the source of truth of the domain knowledge. By working together with the Domain Experts, developers can ensure that the models of the domain remain accurate and up-to-date.

This leads to another critical yet potentially ambiguous term: _model_. Eric Evans, in his book about the DDD, describes the model as follows:

> It is an interpretation of reality that abstracts the aspects relevant to solving the problem at hand and ignores extraneous detail.

Vlad Khononov goes on to explain this idea in terms that are more relatable:

> A model is not a copy of the real world, but a human construct that helps us make sense of real-world systems.

In conclusion, a model is a representation of a business concept or process that facilitates the understanding and communication of the domain's underlying complexity.

Vlad used a map to illustrate the concept of a domain model effectively. Maps are a perfect example of how they only display information that is relevant to the type of map, like topography, roads, or borders. A map that displays all the details at once would be overwhelming and pretty much useless. Domain models can also be found in other forms, such as:

- Customer orders, which represent the simplified version of all the processes happening in the background,
- Restaurant menus, where the items listed on the menu are the final products, instead of listing every ingredient and step in the preparation process,
- Travel bookings, where the booked trip only highlights the most critical details, even though much more goes into planning the travel, hotel, etc.

The last piece of the Domain-Driven Design (DDD) terminology puzzle is the _Ubiquitous Language._ It refers to the shared language used by both technical and business stakeholders in a project. Having a common language to describe the business domain, derived from the domain model, is crucial in DDD. It helps ensure that all team members have a clear understanding of the problem space, its concepts, and their relationships. This leads to better alignment and reduces the risk of misunderstandings. By using Ubiquitous Language, the software solution can accurately reflect the underlying business requirements, making it a critical component of DDD.

With most of the terminology covered, it should be easier to understand _what is Domain-Driven Design_. Now it's time to delve into the actual _how_ - the building blocks of the DDD.

## Building blocks

DDD building blocks serve as the foundation for creating an effective and efficient _Domain Model_. Vlad Khononov defines the Domain Model in the following way:

> A domain model is an object model of the domain that incorporates both behavior and data.

Domain Model consists of various building blocks and structures. The most important ones are:

- Value objects,
- Entities,
- Aggregates,
- Domain events,
- Repositories,
- Domain Services.

### Value Objects

_Value Objects_ are the most basic building blocks available. These are objects that are defined by a set of attributes and values. They don't have a unique identifier - their values define their identity. They are immutable in the sense that different values are already representing a different value object. Examples of Value Objects include:

- Monetary amount,
- Date range,
- Postal address.

Here is how a simple Value Object could be implemented in Python:

```python
from pydantic import BaseModel

class Address(BaseModel):
    """Customer address."""

    country: str
    city: str
    street: str
    house_number: str

    class Config:
        frozen = True
```

It means that using the equality operator (`==`) to compare two addresses will return `True` only if both objects have exactly the same values assigned.

### Entities

_Entities_ are the next type of building block. Entities represent individual objects in the domain with a distinct identity, such as a person or an order. They are similar to the Value Objects in the way that they also store the data, but their attributes can, and are expected, to change, and thus they need a unique identifier. Orders and personal information are just two simple instances of the Entities:

```python
import uuid
from pydantic import BaseModel, Field
from practical_ddd.building_blocks.value_objects import Address

class Person(BaseModel):
    """Personal data."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    first_name: str
    last_name: str
    address: Address

class Order(BaseModel):
    """Customer order."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    description: str
    value: float
```

Because the values of the instances are modifiable in both cases, they need an identification, which can be a UUID. What's more important is that in most cases, entities are not meant to be managed directly, but through an _aggregate_.

### Aggregate

_An Aggregate_ is a type of entity because it is mutable and requires a unique identifier. Its primary responsibility, however, is not to store data, but to group a set of related objects (Entities and Value Objects) together as a single unit of consistency. The Aggregate is the root object, with a well-defined boundary that encapsulates its internal state and enforces invariants to ensure the consistency of the whole group. Aggregates allow reasoning about the domain in a more natural and intuitive way, by focusing on the relationships between objects rather than the objects themselves.

Following on from the preceding examples, an aggregate could be represented as a customer:

```python
import uuid
from pydantic import BaseModel, Field
from practical_ddd.building_blocks.entities import Person, Order
from practical_ddd.building_blocks.value_objects import Address

class Customer(BaseModel):
    """Customer aggregate.

    Manages personal information as well as orders.
    """

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    person: Person
    orders: list[Order] = Field(default_factory=list)

    def change_address(self, new_address: Address) -> None:
        self.person.address = new_address

    def add_order(self, order: Order) -> None:
        if self.total_value + order.value > 10000:
            raise ValueError("Order cannot have value higher than 10000")
        self.orders.append(order)

    def remove_order(self, order_id: uuid.UUID) -> None:
        order = next((order for order in self.orders if order.id == order_id), None)
        if order is None:
            raise IndexError("Order not found")
        self.orders.remove(order)

    @property
    def total_value(self) -> float:
        return sum(order.value for order in self.orders)
```

The customer is directly linked to the personal data and it stores all the orders. On top of that, the aggregate exposes an interface for managing the person's address as well as adding and removing orders. This is due to the fact that the aggregate's state can only be changed by executing the corresponding methods.

While the previous example is relatively straightforward, with only one constraint (order value cannot be greater than 10000), it should demonstrate the use of DDD building blocks and their relationships. In actual systems, aggregates are often more complex, with more constraints, boundaries, and possibly more relationships. After all, their very existence is to manage this complexity. Additionally, in the real world, aggregates would typically be persisted in a data store, such as a database. This is where the _repository_ pattern comes into play.

### Repository

The aggregate's state changes should all be committed transactionally in a single atomic operation. However, it is not the aggregate's responsibility to "persist itself". _Repository_ pattern allows to abstract away the details of data storage and retrieval, and instead, work with aggregates at a higher level of abstraction. Simply put, a repository can be considered as a layer between aggregate and data storage. A JSON file is a fairly simple example of such a store. Customer aggregate could have a repository that operates on JSON files:

```python
import json
import uuid
from practical_ddd.building_blocks.aggregates import Customer

class CustomerJSONRepository:
    """Customer repository operating on JSON files."""

    def __init__(self, path: str) -> None:
        self.path = path

    def get(self, customer_id: uuid.UUID) -> Customer:
        with open(self.path, "r") as file:
            database = json.load(file)
            customer = database["customers"].get(str(customer_id))
            if customer is None:
                raise IndexError("Customer not found")

            person = database["persons"][str(customer["person"])]
            orders = [database["orders"][order_id] for order_id in customer["orders"]]

        return Customer(
            id=customer["id"],
            person=person,
            orders=orders,
        )

    def save(self, customer: Customer) -> None:
        with open(self.path, "r+") as file:
            database = json.load(file)
            # Save customer
            database["customers"][str(customer.id)] = {
                "id": customer.id,
                "person": customer.person.id,
                "orders": [o.id for o in customer.orders],
            }
            # Save person
            database["persons"][str(customer.person.id)] = customer.person.dict()
            # Save orders
            for order in customer.orders:
                database["orders"][str(order.id)] = order.dict()

            file.seek(0)
            json.dump(database, file, indent=4, default=str)
```

Of course, this class could (and perhaps should) do a lot more, but it's not intended to be a perfect, multifunctional ORM. It should give an idea about repository responsibilities, which in this case are storage and retrieval of the customer aggregate in the JSON file. It is also worth noting how the repository handles entities associated with the aggregate. Because personal data and orders are tightly linked to the customer lifecycle, they must be managed precisely when the aggregate is being processed.

### Domain Service

Another case to consider is when there is business logic that simply does not fit into the aggregate or any of its entities or value objects. It could be logic that is dependent on multiple aggregates or the state of the data store. In such cases, a structure known as _Domain Service_ can come in handy. Domain Service must be able to manage aggregates, for example, by using the repository, and then it can store domain logic that doesn't belong to the aggregate. For example, a customer may require logic to avoid losing too many orders:

```python
import uuid
from typing import Protocol
from practical_ddd.building_blocks.aggregates import Customer

class CustomerRepository(Protocol):
    """Customer repository interface."""

    def get(self, customer_id: uuid.UUID) -> Customer:
        ...

    def save(self, customer: Customer) -> None:
        ...

class CustomerService:
    """Customer service."""

    def __init__(self, repository: CustomerRepository) -> None:
        self.repository = repository

    def get_customer(self, customer_id: uuid.UUID) -> Customer | None:
        try:
            return self.repository.get(customer_id)
        except IndexError:
            return None

    def save_customer(self, customer: Customer) -> None:
        existing_customer = self.get_customer(customer.id)
        # If customer is already in the database and has more than 2 orders,
        # he cannot end up with half of them after a single save.
        if (
            existing_customer is not None
            and len(existing_customer.orders) > 2
            and len(customer.orders) < (len(existing_customer.orders) / 2)
        ):
            raise ValueError(
                "Customer cannot lose more than half of his orders upon single save!"
            )

        self.repository.save(customer)
```

Aggregate cannot ensure how its state differs from the one in the JSON file because it has no knowledge of the JSON file in the first place. That is why the comparison logic must be included in the Domain Service. It is also important to note that Domain Service should work with repository abstraction. This makes it simple to swap out the concrete implementation with an alternative one, by using dependency injection.

### Putting it all together

With all the pieces have now been covered, they can be now seen as a working program:

```python
import uuid
from practical_ddd.building_blocks import aggregates, entities, value_objects
from practical_ddd.database.repository import CustomerJSONRepository
from practical_ddd.service import CustomerService

# Initialize domain service with json repository
srv = CustomerService(repository=CustomerJSONRepository("test.json"))

# Create a new customer
customer = aggregates.Customer(
    person=entities.Person(
        first_name="Peter",
        last_name="Tobias",
        address=value_objects.Address(
            country="Germany",
            city="Berlin",
            street="Postdamer Platz",
            house_number="2/3",
        ),
    ),
)
srv.save_customer(customer)

# Add orders to existing customer
customer = srv.get_customer(uuid.UUID("a32dd73a-6c1b-4581-b1d3-2a1247320938"))
assert customer is not None
customer.add_order(entities.Order(description="Order 1", value=10))
customer.add_order(entities.Order(description="Order 2", value=210))
customer.add_order(entities.Order(description="Order 3", value=3210))
srv.save_customer(customer)

# Remove orders from existing customer
# If there are only 3 orders, it's gonna fail
customer = srv.get_customer(uuid.UUID("a32dd73a-6c1b-4581-b1d3-2a1247320938"))
assert customer is not None
customer.remove_order(uuid.UUID("0f3c0a7f-67fd-4309-8ca2-d007ac003b69"))
customer.remove_order(uuid.UUID("a4fd7648-4ea3-414a-a344-56082e00d2f9"))
srv.save_customer(customer)
```

Everything has its responsibilities and boundaries. Aggregate is in charge of managing its entities and value objects, as well as enforcing its constraints. Domain Service uses the injected JSON repository to persist the data in the JSON file and enforce additional domain boundaries. In the end, each component has a distinct function and significance within the specified domain.

## Summary

Domain-Driven Design is without any doubt a complex idea to grasp. It provides practices, patterns, and tools to help software teams tackle the most challenging business problems by placing a strong emphasis on the business domain. DDD is more than just a set of building blocks, however. It is a mindset that requires collaboration and communication between technical and business stakeholders. A shared understanding of the domain, expressed through ubiquitous language, is critical to the success of a DDD project. When done well, DDD can lead to software that is better aligned with the needs of the business and more effective at solving complex problems.

## Afterword and the next steps

This article was never intended to be anything like "DDD: From Zero To Hero," but rather to serve as an introduction to the DDD universe. I wanted to demonstrate the most important concepts of Domain-Driven Design in a very straightforward and practical manner. I believe that learning Domain-Driven Design is an excellent way to boost programming expertise. However, you don't hear about it too often - at least not as much as "11 INSANE JavaScript tips and tricks - a thread 🧵". In any case, if you found any of this interesting, you can look through the sources section for books and articles that inspired me to write this article in the first place. There are some concepts I didn't cover because I thought they were beyond the scope of this introduction, but they are well worth investigating:

- Bounded Contexts
- Domain Events
- Event Storming

You will undoubtedly find them in the sources listed below.

## Sources

Code examples used in the article can be found here: [link](https://github.com/ttobiwan/practical_ddd).

[Learning Domain-Driven Design](https://learning.oreilly.com/library/view/learning-domain-driven-design/9781098100124/) by Vlad Khononov. An amazing book that served as a major source of inspiration for me. Explains all of the concepts discussed in this article in greater depth.

[Architecture Patterns in Python](https://www.cosmicpython.com/) by Harry Percival and Bob Gregory. I read the book almost two years ago, and it had a significant impact on me as a developer. I went back to it while writing this article, and it helped me once more.

[DDD in Python](https://dddinpython.com/) by Przemysław Górecki. I discovered this blog near the end of writing the article, but it piqued my interest because of how insanely professional it is. Fun fact: I worked in the same company as Przemysław, and I was completely unaware of it.

