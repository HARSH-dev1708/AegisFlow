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

### Local database

The default `local` profile uses embedded, file-backed H2 at `backend/data/aegisflow` and applies schema migrations with Flyway at startup. No database server or account needs to be installed for local development. Local demo data, including the demo administrator, is inserted only when the database has no projects. Demo login: `devops@aegisflow.io` / `password123`. Keep this account and local profile out of non-local deployments.

To start locally from `backend/`:

```sh
export AEGISFLOW_JWT_SECRET="$(openssl rand -base64 48)"
export AUTH_COOKIE_SECURE=false
./mvnw spring-boot:run
```

H2 files are ignored by Git. To start with an empty local dataset, stop the backend and remove only the local database files under `backend/data/`; Flyway will recreate the schema and local seed data on next start.

The schema is managed by versioned Flyway scripts in `src/main/resources/db/migration`. Add a new `V<number>__description.sql` migration for each schema change; do not edit a migration that has already run on a database. Hibernate validates the migrated schema at startup and does not create or drop tables.

For a future PostgreSQL or MySQL deployment, provision the database and credentials, add the matching JDBC driver, and set `DB_URL`, `DB_DRIVER`, `DB_USERNAME`, and `DB_PASSWORD`. Set `aegisflow.demo-data.enabled=false` (or use a non-local profile), keep `AEGISFLOW_JWT_SECRET` strong and private, and run Flyway migrations during deployment. Review vendor-specific SQL and add Flyway vendor-specific migration locations when a migration is not portable. Do not point production at the local H2 file.

Public registrations receive the `DEVELOPER` role. The optional bootstrap creates or promotes a configured account to `ADMIN` when `BOOTSTRAP_ADMIN_ENABLED=true`; configure its email and password only in a secret manager/environment. Access JWTs last 15 minutes. Refresh tokens are rotated, stored only as hashes in the database, and delivered in an HttpOnly cookie for seven days.

### Maven Parent overrides

Due to Maven's design, elements are inherited from the parent POM to the project POM.
While most of the inheritance is fine, it also inherits unwanted elements like `<license>` and `<developers>` from the parent.
To prevent this, the project POM contains empty overrides for these elements.
If you manually switch to a different parent and actually want the inheritance, you need to remove those overrides.
