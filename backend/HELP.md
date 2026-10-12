# Getting Started

### Reference Documentation
For further reference, please consider the following sections:

* [Official Apache Maven documentation](https://maven.apache.org/guides/index.html)
* [Spring Boot Maven Plugin Reference Guide](https://docs.spring.io/spring-boot/4.1.1/maven-plugin)
* [Create an OCI image](https://docs.spring.io/spring-boot/4.1.1/maven-plugin/build-image.html)
* [Spring Web](https://docs.spring.io/spring-boot/4.1.1/reference/web/servlet.html)
* [Spring Data JPA](https://docs.spring.io/spring-boot/4.1.1/reference/data/sql.html#data.sql.jpa-and-spring-data)
* [Spring Boot DevTools](https://docs.spring.io/spring-boot/4.1.1/reference/using/devtools.html)

### Guides
The following guides illustrate how to use some features concretely:

* [Building a RESTful Web Service](https://spring.io/guides/gs/rest-service/)
* [Serving Web Content with Spring MVC](https://spring.io/guides/gs/serving-web-content/)
* [Building REST services with Spring](https://spring.io/guides/tutorials/rest/)
* [Accessing Data with JPA](https://spring.io/guides/gs/accessing-data-jpa/)

### Authentication configuration

The API requires a strong signing secret in `AEGISFLOW_JWT_SECRET` (at least 32 bytes). For local HTTP development, set `AUTH_COOKIE_SECURE=false`; use `true` behind HTTPS. Set `CORS_ALLOWED_ORIGINS` to a comma-separated list of exact frontend origins when they differ from the Vite defaults.

For example, from `backend/`:

```sh
export AEGISFLOW_JWT_SECRET="$(openssl rand -base64 48)"
export AUTH_COOKIE_SECURE=false
export BOOTSTRAP_ADMIN_ENABLED=true
export BOOTSTRAP_ADMIN_EMAIL=admin@example.com
export BOOTSTRAP_ADMIN_PASSWORD='choose-a-unique-password'
./mvnw spring-boot:run
```

The optional bootstrap creates or promotes the configured account to `ADMIN` at startup. Public registrations receive the `DEVELOPER` role. Demo data, including the sample admin credentials, is disabled by default; enable `aegisflow.demo-data.enabled=true` only in a disposable local environment. Access JWTs last 15 minutes. Refresh tokens are rotated, stored only as hashes in the database, and delivered in an HttpOnly cookie for seven days. Configure persistent storage before using this setup beyond local development.

### Maven Parent overrides

Due to Maven's design, elements are inherited from the parent POM to the project POM.
While most of the inheritance is fine, it also inherits unwanted elements like `<license>` and `<developers>` from the parent.
To prevent this, the project POM contains empty overrides for these elements.
If you manually switch to a different parent and actually want the inheritance, you need to remove those overrides.
