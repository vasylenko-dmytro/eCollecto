package com.vasylenko.ecollectobackend.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.security.SecuritySchemes;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.context.annotation.Configuration;

/**
 * Global OpenAPI definition: API metadata, top-level tags, and security schemes.
 *
 * <p>Security schemes defined here are referenced per-operation via
 * {@code @SecurityRequirement(name = "bearerAuth")} on individual controller methods.
 * Public catalog endpoints carry no {@code @SecurityRequirement} and remain open.</p>
 *
 * <p>The committed {@code openapi.yaml} is generated automatically by
 * {@code OpenApiSpecTest} — do not edit it by hand.
 * Run {@code ./gradlew :backend:ecollecto-backend:test} to regenerate it.</p>
 */
@Configuration
@OpenAPIDefinition(
        info = @Info(
                title   = "eCollecto API",
                version = "v1",
                description =
                        "eCollecto philatelic collection REST API. " +
                        "Public catalog endpoints are accessible without authentication. " +
                        "Protected endpoints require a valid Bearer JWT issued by Keycloak."
        ),
        tags = {
                @Tag(name = "Stamps",           description = "Stamp lookup endpoints."),
                @Tag(name = "First Day Covers", description = "First day cover lookup endpoints."),
                @Tag(name = "Designers",        description = "Designer lookup endpoints."),
                @Tag(name = "Tariffs",          description = "Tariff lookup endpoints."),
                @Tag(name = "User",             description = "User profile endpoints (protected — requires Bearer JWT).")
        }
)
@SecuritySchemes({
        @SecurityScheme(
                name          = "bearerAuth",
                type          = SecuritySchemeType.HTTP,
                scheme        = "bearer",
                bearerFormat  = "JWT",
                description   =
                        "JWT Bearer token issued by Keycloak (Authorization Code + PKCE). " +
                        "Obtain a token from: " +
                        "http://localhost:8180/realms/ecollecto/protocol/openid-connect/token"
        ),
        @SecurityScheme(
                name             = "openIdConnect",
                type             = SecuritySchemeType.OPENIDCONNECT,
                openIdConnectUrl = "http://localhost:8180/realms/ecollecto/.well-known/openid-configuration",
                description      =
                        "OpenID Connect discovery for the eCollecto Keycloak realm. " +
                        "Use the ecollecto-ui public client with PKCE (S256) for the browser flow."
        )
})
public class OpenApiConfig {
}


