/**
 * Order Parameter Validation Utilities
 *
 * This module provides comprehensive validation functions for order parameters,
 * including size, price, limits, instrument names, and other order-related validations.
 */

import { ethers } from "ethers";
import { ORDER_CONFIG, VALIDATION_RULES } from "./order-config";
import type { OrderParams } from "./order-signing";

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface DetailedValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface OrderLimits {
  minSize: number;
  maxSize: number;
  minPrice: number;
  maxPrice: number;
  maxOrderValue: number;
  availableBalance?: number;
}

export class OrderValidator {
  /**
   * Validates order size according to protocol limits and user balance
   */
  validateOrderSize(
    size: number,
    limits: OrderLimits,
    direction: "buy" | "sell",
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check if size is a valid number
    if (isNaN(size) || !isFinite(size)) {
      errors.push({
        field: "amount",
        message: "Order size must be a valid number",
        code: "INVALID_SIZE_FORMAT",
      });
      return errors;
    }

    // Check minimum size
    if (size < limits.minSize) {
      errors.push({
        field: "amount",
        message: `Order size must be at least ${limits.minSize}`,
        code: "SIZE_TOO_SMALL",
      });
    }

    // Check maximum size
    if (size > limits.maxSize) {
      errors.push({
        field: "amount",
        message: `Order size cannot exceed ${limits.maxSize}`,
        code: "SIZE_TOO_LARGE",
      });
    }

    // Check size precision
    const sizePrecision = this.getDecimalPlaces(size);
    if (sizePrecision > ORDER_CONFIG.LIMITS.SIZE_PRECISION) {
      errors.push({
        field: "amount",
        message: `Order size can have at most ${ORDER_CONFIG.LIMITS.SIZE_PRECISION} decimal places`,
        code: "SIZE_PRECISION_EXCEEDED",
      });
    }

    // Check size step size
    const remainder = size % VALIDATION_RULES.SIZE_STEP_SIZE;
    if (remainder !== 0) {
      errors.push({
        field: "amount",
        message: `Order size must be a multiple of ${VALIDATION_RULES.SIZE_STEP_SIZE}`,
        code: "INVALID_SIZE_STEP",
      });
    }

    return errors;
  }

  /**
   * Validates order price according to protocol limits and market conditions
   */
  validateOrderPrice(
    price: number,
    limits: OrderLimits,
    orderType: "limit" | "market",
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Market orders don't need price validation
    if (orderType === "market") {
      return errors;
    }

    // Check if price is a valid number
    if (isNaN(price) || !isFinite(price)) {
      errors.push({
        field: "limit_price",
        message: "Order price must be a valid number",
        code: "INVALID_PRICE_FORMAT",
      });
      return errors;
    }

    // Check minimum price
    if (price < limits.minPrice) {
      errors.push({
        field: "limit_price",
        message: `Order price must be at least ${limits.minPrice}`,
        code: "PRICE_TOO_LOW",
      });
    }

    // Check maximum price
    if (price > limits.maxPrice) {
      errors.push({
        field: "limit_price",
        message: `Order price cannot exceed ${limits.maxPrice}`,
        code: "PRICE_TOO_HIGH",
      });
    }

    // Check price precision
    const pricePrecision = this.getDecimalPlaces(price);
    if (pricePrecision > ORDER_CONFIG.LIMITS.PRICE_PRECISION) {
      errors.push({
        field: "limit_price",
        message: `Order price can have at most ${ORDER_CONFIG.LIMITS.PRICE_PRECISION} decimal places`,
        code: "PRICE_PRECISION_EXCEEDED",
      });
    }

    // Check price step size
    const remainder = price % VALIDATION_RULES.PRICE_STEP_SIZE;
    if (Math.abs(remainder) > 1e-10) {
      // Use small epsilon for floating point comparison
      errors.push({
        field: "limit_price",
        message: `Order price must be a multiple of ${VALIDATION_RULES.PRICE_STEP_SIZE}`,
        code: "INVALID_PRICE_STEP",
      });
    }

    return errors;
  }

  /**
   * Validates instrument name format according to Derive specifications
   */
  validateInstrumentName(instrumentName: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!instrumentName || typeof instrumentName !== "string") {
      errors.push({
        field: "instrument_name",
        message: "Instrument name is required",
        code: "MISSING_INSTRUMENT_NAME",
      });
      return errors;
    }

    // Trim whitespace
    const trimmedName = instrumentName.trim();
    if (trimmedName !== instrumentName) {
      errors.push({
        field: "instrument_name",
        message: "Instrument name cannot have leading or trailing whitespace",
        code: "INVALID_INSTRUMENT_FORMAT",
      });
    }

    // Check for options format: ETH-20240315-C-3000
    const isValidOption =
      VALIDATION_RULES.INSTRUMENT_NAME_PATTERN.test(trimmedName);

    // Check for futures format: ETH-PERP
    const isValidFuture =
      VALIDATION_RULES.FUTURES_INSTRUMENT_PATTERN.test(trimmedName);

    if (!isValidOption && !isValidFuture) {
      errors.push({
        field: "instrument_name",
        message:
          'Invalid instrument name format. Expected format: "ETH-20240315-C-3000" for options or "ETH-PERP" for futures',
        code: "INVALID_INSTRUMENT_FORMAT",
      });
    }

    // Additional validation for options
    if (isValidOption) {
      const optionErrors = this.validateOptionInstrument(trimmedName);
      errors.push(...optionErrors);
    }

    return errors;
  }

  /**
   * Validates subaccount ID according to protocol limits
   */
  validateSubaccountId(subaccountId: number): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!Number.isInteger(subaccountId)) {
      errors.push({
        field: "subaccount_id",
        message: "Subaccount ID must be an integer",
        code: "INVALID_SUBACCOUNT_FORMAT",
      });
      return errors;
    }

    if (subaccountId < ORDER_CONFIG.LIMITS.MIN_SUBACCOUNT_ID) {
      errors.push({
        field: "subaccount_id",
        message: `Subaccount ID must be at least ${ORDER_CONFIG.LIMITS.MIN_SUBACCOUNT_ID}`,
        code: "SUBACCOUNT_TOO_LOW",
      });
    }

    if (subaccountId > ORDER_CONFIG.LIMITS.MAX_SUBACCOUNT_ID) {
      errors.push({
        field: "subaccount_id",
        message: `Subaccount ID cannot exceed ${ORDER_CONFIG.LIMITS.MAX_SUBACCOUNT_ID}`,
        code: "SUBACCOUNT_TOO_HIGH",
      });
    }

    return errors;
  }

  /**
   * Validates signature expiry time
   */
  validateExpiryTime(expiryTime: number): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!Number.isInteger(expiryTime)) {
      errors.push({
        field: "signature_expiry_sec",
        message: "Expiry time must be an integer timestamp",
        code: "INVALID_EXPIRY_FORMAT",
      });
      return errors;
    }

    const currentTime = Math.floor(Date.now() / 1000);

    if (expiryTime <= currentTime) {
      errors.push({
        field: "signature_expiry_sec",
        message: "Signature expiry time must be in the future",
        code: "EXPIRY_IN_PAST",
      });
    }

    // Check if expiry is too far in the future (more than 24 hours)
    const maxExpiryTime = currentTime + 24 * 60 * 60; // 24 hours
    if (expiryTime > maxExpiryTime) {
      errors.push({
        field: "signature_expiry_sec",
        message:
          "Signature expiry time cannot be more than 24 hours in the future",
        code: "EXPIRY_TOO_FAR",
      });
    }

    return errors;
  }

  /**
   * Validates order value against limits and available balance
   */
  validateOrderValue(
    size: number,
    price: number,
    direction: "buy" | "sell",
    availableBalance?: number,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    const orderValue = size * price;

    // Check minimum order value
    if (orderValue < ORDER_CONFIG.LIMITS.MIN_ORDER_VALUE) {
      errors.push({
        field: "order_value",
        message: `Order value must be at least $${ORDER_CONFIG.LIMITS.MIN_ORDER_VALUE}`,
        code: "ORDER_VALUE_TOO_LOW",
      });
    }

    // Check maximum order value
    if (orderValue > ORDER_CONFIG.LIMITS.MAX_ORDER_VALUE) {
      errors.push({
        field: "order_value",
        message: `Order value cannot exceed $${ORDER_CONFIG.LIMITS.MAX_ORDER_VALUE}`,
        code: "ORDER_VALUE_TOO_HIGH",
      });
    }

    // Check available balance for buy orders
    if (direction === "buy" && availableBalance !== undefined) {
      if (orderValue > availableBalance) {
        errors.push({
          field: "balance",
          message: `Insufficient balance. Required: $${orderValue.toFixed(2)}, Available: $${availableBalance.toFixed(2)}`,
          code: "INSUFFICIENT_BALANCE",
        });
      }
    }

    return errors;
  }

  /**
   * Comprehensive validation of all order parameters
   */
  validateCompleteOrder(
    order: OrderParams,
    limits: OrderLimits,
    availableBalance?: number,
  ): DetailedValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Validate required fields
    const requiredFieldErrors = this.validateRequiredFields(order);
    errors.push(...requiredFieldErrors);

    // If required fields are missing, return early
    if (requiredFieldErrors.length > 0) {
      return {
        isValid: false,
        errors,
        warnings,
      };
    }

    // Validate individual parameters
    errors.push(...this.validateInstrumentName(order.instrument_name));
    errors.push(...this.validateSubaccountId(order.subaccount_id));
    errors.push(
      ...this.validateOrderSize(order.amount, limits, order.direction),
    );
    errors.push(
      ...this.validateOrderPrice(order.limit_price, limits, order.order_type),
    );
    errors.push(...this.validateExpiryTime(order.signature_expiry_sec));
    errors.push(
      ...this.validateOrderValue(
        order.amount,
        order.limit_price,
        order.direction,
        availableBalance,
      ),
    );

    // Validate direction
    if (!VALIDATION_RULES.VALID_DIRECTIONS.includes(order.direction)) {
      errors.push({
        field: "direction",
        message: 'Order direction must be "buy" or "sell"',
        code: "INVALID_DIRECTION",
      });
    }

    // Validate order type
    if (!VALIDATION_RULES.VALID_ORDER_TYPES.includes(order.order_type)) {
      errors.push({
        field: "order_type",
        message: 'Order type must be "limit" or "market"',
        code: "INVALID_ORDER_TYPE",
      });
    }

    // Validate signer address
    if (!ethers.utils.isAddress(order.signer)) {
      errors.push({
        field: "signer",
        message: "Invalid signer address format",
        code: "INVALID_SIGNER_ADDRESS",
      });
    }

    // Validate max_fee
    try {
      ethers.BigNumber.from(order.max_fee);
    } catch {
      errors.push({
        field: "max_fee",
        message: "Invalid max_fee format. Must be a valid number string",
        code: "INVALID_MAX_FEE_FORMAT",
      });
    }

    // Add warnings for potentially risky orders
    if (order.order_type === "market") {
      warnings.push(
        "Market orders execute immediately at current market price",
      );
    }

    if (order.amount > limits.maxSize * 0.8) {
      warnings.push("Large order size may impact market price");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates that all required fields are present
   */
  private validateRequiredFields(
    order: Partial<OrderParams>,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const field of VALIDATION_RULES.REQUIRED_ORDER_FIELDS) {
      const value = order[field as keyof OrderParams];
      if (value === undefined || value === null || value === "") {
        errors.push({
          field,
          message: `${field} is required`,
          code: "MISSING_REQUIRED_FIELD",
        });
      }
    }

    return errors;
  }

  /**
   * Validates option instrument format and expiry date
   */
  private validateOptionInstrument(instrumentName: string): ValidationError[] {
    const errors: ValidationError[] = [];

    try {
      // Parse option instrument: ETH-20240315-C-3000
      const parts = instrumentName.split("-");
      if (parts.length !== 4) {
        return errors; // Already validated by regex
      }

      const [asset, dateStr, optionType, strikeStr] = parts;

      // Validate expiry date
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6));
      const day = parseInt(dateStr.substring(6, 8));

      const expiryDate = new Date(year, month - 1, day);
      const currentDate = new Date();

      if (expiryDate <= currentDate) {
        errors.push({
          field: "instrument_name",
          message: "Option expiry date must be in the future",
          code: "OPTION_EXPIRED",
        });
      }

      // Validate option type
      if (optionType !== "C" && optionType !== "P") {
        errors.push({
          field: "instrument_name",
          message: 'Option type must be "C" (call) or "P" (put)',
          code: "INVALID_OPTION_TYPE",
        });
      }

      // Validate strike price
      const strike = parseFloat(strikeStr);
      if (isNaN(strike) || strike <= 0) {
        errors.push({
          field: "instrument_name",
          message: "Invalid strike price in instrument name",
          code: "INVALID_STRIKE_PRICE",
        });
      }
    } catch (error) {
      errors.push({
        field: "instrument_name",
        message: "Failed to parse option instrument name",
        code: "OPTION_PARSE_ERROR",
      });
    }

    return errors;
  }

  /**
   * Gets the number of decimal places in a number
   */
  private getDecimalPlaces(num: number): number {
    const str = num.toString();
    if (str.indexOf(".") !== -1 && str.indexOf("e-") === -1) {
      return str.split(".")[1].length;
    } else if (str.indexOf("e-") !== -1) {
      const parts = str.split("e-");
      return parseInt(parts[1], 10);
    }
    return 0;
  }
}

// Utility functions for common validations
export const orderValidator = new OrderValidator();

/**
 * Quick validation function for order size
 */
export function validateSize(size: number, limits: OrderLimits): boolean {
  const errors = orderValidator.validateOrderSize(size, limits, "buy");
  return errors.length === 0;
}

/**
 * Quick validation function for order price
 */
export function validatePrice(
  price: number,
  limits: OrderLimits,
  orderType: "limit" | "market",
): boolean {
  const errors = orderValidator.validateOrderPrice(price, limits, orderType);
  return errors.length === 0;
}

/**
 * Quick validation function for instrument name
 */
export function validateInstrument(instrumentName: string): boolean {
  const errors = orderValidator.validateInstrumentName(instrumentName);
  return errors.length === 0;
}

/**
 * Creates default order limits from configuration
 */
export function getDefaultOrderLimits(): OrderLimits {
  return {
    minSize: ORDER_CONFIG.LIMITS.MIN_ORDER_SIZE,
    maxSize: ORDER_CONFIG.LIMITS.MAX_ORDER_SIZE,
    minPrice: ORDER_CONFIG.LIMITS.MIN_PRICE,
    maxPrice: ORDER_CONFIG.LIMITS.MAX_PRICE,
    maxOrderValue: ORDER_CONFIG.LIMITS.MAX_ORDER_VALUE,
  };
}

/**
 * Formats validation errors for display to users
 */
export function formatValidationErrors(errors: ValidationError[]): string[] {
  return errors.map((error) => error.message);
}

/**
 * Groups validation errors by field
 */
export function groupErrorsByField(
  errors: ValidationError[],
): Record<string, ValidationError[]> {
  return errors.reduce(
    (acc, error) => {
      if (!acc[error.field]) {
        acc[error.field] = [];
      }
      acc[error.field].push(error);
      return acc;
    },
    {} as Record<string, ValidationError[]>,
  );
}
