/**
 * Order Validation Service for Derive Protocol
 */

export interface OrderLimits {
  minOrderSize: number;
  maxOrderSize: number;
  minPrice: number;
  maxPrice: number;
  maxFee: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

export interface DetailedValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export class OrderValidator {
  validateCompleteOrder(
    order: any,
    limits: OrderLimits,
    availableBalance?: number,
  ): DetailedValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate order size
    if (!order.amount || order.amount <= 0) {
      errors.push({
        field: "amount",
        message: "Order size must be greater than 0",
        code: "INVALID_SIZE",
      });
    } else if (order.amount < limits.minOrderSize) {
      errors.push({
        field: "amount",
        message: `Order size must be at least ${limits.minOrderSize}`,
        code: "SIZE_TOO_SMALL",
      });
    } else if (order.amount > limits.maxOrderSize) {
      errors.push({
        field: "amount",
        message: `Order size cannot exceed ${limits.maxOrderSize}`,
        code: "SIZE_TOO_LARGE",
      });
    }

    // Validate limit price for limit orders
    if (order.order_type === "limit") {
      if (!order.limit_price || order.limit_price <= 0) {
        errors.push({
          field: "limit_price",
          message: "Limit price must be greater than 0",
          code: "INVALID_PRICE",
        });
      } else if (order.limit_price < limits.minPrice) {
        errors.push({
          field: "limit_price",
          message: `Limit price must be at least ${limits.minPrice}`,
          code: "PRICE_TOO_LOW",
        });
      } else if (order.limit_price > limits.maxPrice) {
        errors.push({
          field: "limit_price",
          message: `Limit price cannot exceed ${limits.maxPrice}`,
          code: "PRICE_TOO_HIGH",
        });
      }
    }

    // Validate instrument name
    if (!order.instrument_name) {
      errors.push({
        field: "instrument_name",
        message: "Instrument name is required",
        code: "MISSING_INSTRUMENT",
      });
    }

    // Validate balance if provided
    if (availableBalance !== undefined && order.order_type === "limit") {
      const orderValue = order.amount * order.limit_price;
      if (orderValue > availableBalance) {
        errors.push({
          field: "balance",
          message: "Insufficient balance for this order",
          code: "INSUFFICIENT_BALANCE",
        });
      }
    }

    // Add warnings for market orders
    if (order.order_type === "market") {
      warnings.push({
        field: "order_type",
        message: "Market orders execute immediately at current market price",
        code: "MARKET_ORDER_WARNING",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export function getDefaultOrderLimits(): OrderLimits {
  return {
    minOrderSize: 0.01,
    maxOrderSize: 1000000,
    minPrice: 0.01,
    maxPrice: 1000000,
    maxFee: "0.01",
  };
}

export const orderValidator = new OrderValidator();
