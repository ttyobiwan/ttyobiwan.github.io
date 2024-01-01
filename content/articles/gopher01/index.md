---
title: "Gopher Pythonista #1: From Python to Go"
date: 2023-07-26
tags: ["go", "python"]
series: ["Gopher Pythonista"]
series_order: 1
---

Throughout my career, I have primarily focused on developing backend systems using Python. Despite dabbling in front-end work, I always found myself gravitating back toward API development. In order to expand my skill set, I have experimented with writing backend applications using different programming languages such as JavaScript/Typescript and Rust. I have tested various technologies and frameworks, some of which I found more enjoyable than others. Nonetheless, there remains one language that I have yet to explore: Go.

When I first started using Golang, it felt a little unfamiliar due to its simplicity, unique error handling, and some unusual design choices like struct tags. However, even before getting fully accustomed to these "quirks", I quickly realized several things about Go that I genuinely appreciate. Interestingly, these same features can be seen as challenges in my primary programming language, Python.

In this article, I will share my initial thoughts on using Go as a Python engineer. I will highlight the aspects of Go that I appreciate, which may not be as prominent in Python. These include: 

- built-in tools
- packaging
- backend focus
- setting up Docker
- performance

By the end of this article, you will understand why Go is an excellent option for backend applications and how it compares to Python in terms of convenience.

## Tooling

When it comes to building software, the main task is writing code. However, there are several potential problems that can arise during this process. These can include:

- incorrect formatting
- bugs
- common code issues

As engineers and humans, it's impossible to guarantee that our work is completely flawless. This is where automated tools like linters, unit tests, and static analysis can be incredibly useful in providing additional assistance.

When working with Python, formatting can be a challenge. While the most popular tool for formatting is *black*, it requires installation and configuration. However, configuration can be difficult as there are multiple ways to do it, with `pyproject.toml` being the default option according to [PEP 518](https://www.python.org/dev/peps/pep-0518/), but not all tools support it.

In terms of linting, prior to the release of *ruff* in 2022, Python developers had to rely on *flake8* and its various plugins, which were inconvenient to configure. Thankfully, *ruff* now supports many features and can be configured via the `pyproject.toml` file.

Similarly, if you want more powerful testing capabilities than what is offered by the built-in *unittest*, you'll need to install and configure additional tools and addons. It's important to ensure that all of these components work together properly in your CI system as well.

When working with Go, the development experience can be quite different. Upon installation, you will have access to a wide range of tools to aid your local development.

Compared to Python, formatting rules in Go are less strict. For example, there is no fixed line length. However, Go has a built-in formatting tool that can be accessed through the `go fmt` command, eliminating the need for additional installation or configuration.

Another useful tool in Go is the `go vet` command, which helps to identify common coding mistakes such as unreachable code or useless comparisons. In addition, external linters like [staticcheck](https://staticcheck.dev/) can be used to detect bugs and performance issues with ease.

For testing purposes, Go provides a `go test` command that automatically discovers tests within your application and supports features such as caching and code coverage. However, if you require more advanced testing capabilities such as suites or mocking, you will need to install a toolkit like [testify](https://github.com/stretchr/testify/). Overall, while Go provides a highly effective testing experience, it's worth noting that writing tests in Python using *pytest* is arguably one of the most enjoyable testing experiences I have encountered across all programming languages.

It's also important to remember that there's no need to use type-checking tools such as *mypy* with Go, as it's a compiled and statically-typed language.

In summary, once you've installed Go, you'll have access to the necessary tools to support your code writing efforts. The next step is to focus on packaging and managing dependencies.

## Packaging

Managing dependencies is crucial when building software. While Golang has an extensive standard library, more complex projects often require external packages. Luckily, Go provides excellent tools for effectively managing dependencies.

Go projects come with two files: `go.mod` and `go.sum`. The `go.mod` file is particularly crucial as it lists all the direct and indirect dependencies along with their versions. The `go.sum` file is automatically generated to serve as a checksum of the dependencies.

To install a package, you use the `go get <package>` command. The good news is that this command saves the installed packages in the `$GOPATH/pkg/mod` directory, so there is no need to manually create virtual environments or similar things.

In addition, you can use the `go mod tidy` command to ensure consistency between the `go.mod` file and the source code in the module. This command will add any missing module requirements needed to build the current module's packages and dependencies. If there are any unused dependencies, `go mod tidy` will remove them from `go.mod`.

Finally, publishing packages with Go is incredibly simple. To install them, you typically just need to use the repository link, such as `go get github.com/tobias-piotr/gouth0`. So, to publish your own package, all you have to do is properly set up your module in the `go.mod` file, create a public repository, and request the package at https://pkg.go.dev/. After a short period of time, your package will be available in the Go module index. That's it.

Now compare this with Python. By default, Python doesn't even have a checksum file. If you want more advanced features, you'll need to install a tool like *poetry*, which has many external dependencies. Managing project dependencies can be done through a file, but you'll need to create and maintain it yourself. Compared to Go, publishing packages to PyPI can also feel inconvenient.

Without further criticism of Python packaging, Go's packaging feels much simpler and more convenient. The next chapter will cover how Go's setup is beneficial when working with Docker.

## Docker

When it comes to building web applications in the modern world, Docker is usually involved. It simplifies the process of setting up a project locally and deploying it to production.

Creating a Dockerfile for a Golang project is remarkably easy for two primary reasons: the Go tooling mentioned earlier and the fact that Go is a compiled language. Additionally, the combination of these two factors leads to a very standardized method of setting up a project. This means that if you copy a Dockerfile from one Golang project to another, there is a high probability that it will work without any issues. This is quite different from the situation in Python.

With all of this in mind, take a look at a Dockerfile from one of my Go projects:

```Dockerfile
FROM golang:1.20.6-alpine AS builder

EXPOSE 8080

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /main

# Local development
FROM builder as dev

ENV DEBUG=true

# Install air for hot reloading
RUN go install github.com/cosmtrek/air@latest

ENTRYPOINT ["air"]

# Production
FROM gcr.io/distroless/base-debian11 AS prod

WORKDIR /

COPY --from=builder /main /main

USER nonroot:nonroot

ENTRYPOINT ["/main"]
```

Without diving too deep into the Docker syntax, this config simply downloads dependencies, compiles code, and runs the binary file. It's important to note that Go, being a compiled language, improves this process. For example, you can use a tool like *air* to use the binary file and enable hot reloading while developing locally. Additionally, in production, a smaller base image can be used because no OS dependencies are required to start the binary file. This significantly reduces the image size of your app.

Starting a new project in Go is great because it's easy to set up a fully working and optimized Dockerfile. With tooling, packaging and containerizing covered, we can finally focus on the language's features.

## Backend focus

When I first started working with Go, I had doubts about its suitability for backend development. However, it didn't take long for me to realize that Go is actually designed with backend development in mind.

One of the main things that makes Go well-suited for backend development is its standard library. This library includes a variety of useful packages for tasks such as encoding, cryptography, and database management. Most importantly, it also includes packages for building HTTP servers, which means you can create a semi-sophisticated API without needing to install any additional dependencies. For instance, I was able to develop an authentication API for interacting with Auth0 using just one external package (for structured logging). You can view the code here: [goloxy](https://github.com/tobias-piotr/goloxy).

On top of that, there are many amazing packages available for developing web applications, including:

- web frameworks: Gin, Fiber, chi, Echo
- validation: validate, ozzo-validation, Valgo
- structured logging: zap, logrus, zerolog
- database interactions: GORM, sqlx, sqlc, Ent

My preferred combination is Echo/chi as a web framework, Valgo for validation, zap for structured logging, sqlx for database interactions, and Fx for dependency injection. This setup has been effective for most of my projects, though it may vary depending on specific requirements.

To highlight a difference with Python, configuring structured logging can be a challenge, even with a great framework like FastAPI. In an Echo app, I configure the zap logger in the following way:

```go
e.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
	LogProtocol:  true,
	LogMethod:    true,
	LogURI:       true,
	LogStatus:    true,
	LogRequestID: true,
	LogRemoteIP:  true,
	LogLatency:   true,
	LogError:     true,
	LogValuesFunc: func(c echo.Context, v middleware.RequestLoggerValues) error {
		logger.Info(
			fmt.Sprintf("%s %s %s %v", v.Protocol, v.Method, v.URI, status),
			zap.String("protocol", v.Protocol),
			zap.String("method", v.Method),
			zap.String("uri", v.URI),
			zap.Int("status", status),
			zap.String("request_id", v.RequestID),
			zap.String("remote_ip", v.RemoteIP),
			zap.String("latency", v.Latency.String()),
			zap.Error(v.Error),
		)
		return nil
	},
}))
```

In addition to creating a logger instance, which is usually just a few lines, this is all that is required to have complete control over the logger for each request. An example of setting up structured logging in a FastAPI app can be found using the *structlog* package at this [link](https://gist.github.com/nymous/f138c7f06062b7c43c060bf03759c29e). This is surely overwhelming, even when you are fully aware of what's going on there.

To summarize, Go has excellent built-in and externally installable solutions for developing web apps. However, implementation is just the beginning. The next chapter will cover the performance of Golang code.

## Performance

When examining the most popular uses of Go, examples include proxies, infrastructure management, and "typical" web development. One of the reasons for its popularity is the exceptional performance of Go, especially when compared to Python, which is known to have weaker performance. 

There are numerous factors that contribute to Go's superior performance. such as: 

- lightweight design, which reduces runtime overhead
- efficient garbage collection
- impressive concurrency model with Goroutines
- strong typing and static analysis

These are just a few examples of the reasons why Go is so well-performing. All of these features enable the creation of highly optimized applications that can efficiently handle large workloads and easily scale even further.

It's possible that one might argue that performance isn't crucial in many applications. In such cases, you could simply select Python, take code from a previous FastAPI project, base it around asyncio, and it should perform well enough. This argument may be valid. However, performance isn't just about speed; it also relates to resources.

You might not notice speed differences when comparing an app written in Golang to one in Python - the differences are in nanoseconds. However, you will definitely see the difference in resource usage. The app developed in Go will use significantly fewer resources. This will be evident through lower costs. I recommend watching [Ben Davis' video](https://www.youtube.com/watch?v=kUoPdQwyABA) where he explains how rewriting a SAAS project in Go resulted in reduced costs.

When it comes to performance, Python doesn't have the best reputation. This is largely due to the GIL, dynamic typing, and awkward concurrency model. While there are optimizations available, such problems are less frequent in Go. Therefore, when prioritizing performance, Go may be the better option.

## Summary

Based on my experience with various technologies, I have some personal favorites. However, when building software, it is important to consider multiple factors before choosing the best tech stack. For backend development, Go stands out as an excellent option, especially when performance and cost are crucial. Nevertheless, it's not without any flaws. I believe that in modern Python, FastAPI and Pydantic are its strongest features for web development. They offer features like dependency injection, Swagger documentation, exceptional validation, and error handling right out of the box. I also find pytest to be the most well-designed test writing tool I've encountered. In summary, Go lacks some of the drawbacks that Python has, but Python has a wealth of features and libraries for app development. Ultimately, it depends on your specific needs and trade-offs.
