package com.vasylenko.ecollectobackend.common.model;

/**
 * Represents the supported currencies for the system.
 */
public enum Currency {
    UAH,
    USD;

    /**
     * Converts a string value to its corresponding {@link Currency} constant.
     * The matching is case-insensitive.
     *
     * @param value The string representation of the currency (e.g., "usd", "UAH").
     * @return The matching {@link Currency} enum constant.
     * @throws IllegalArgumentException if the provided value is null or does not match
     * any supported currency.
     */
    public static Currency from(String value) {
        try {
            return Currency.valueOf(value.toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException(
                    "Unsupported currency: " + value + ". Allowed: UAH, USD");
        }
    }
}
