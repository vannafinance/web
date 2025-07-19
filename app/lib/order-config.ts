/**
 * Order Configuration and Constants for Derive Protocol
 *
 * This file contains all configuration constants for order submission,
 * including protocol constants, order limits, timeouts, and validation rules.
 */

// Environment detection
const isTestnet =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_DERIVE_NETWORK === "testnet";

// Protocol Constants from Derive Documentation
export const DERIVE_PROTOCOL_CONSTANTS = {
  // EIP-712 Domain Constants
  DOMAIN_NAME: "Derive",
  DOMAIN_VERSION: "1",
  DOMAIN_CHAIN_ID: isTestnet ? 421614 : 42161, // Arbitrum Sepolia testnet : Arbitrum One mainnet

  // Contract Addresses (these would need to be updated with actual Derive contract addresses)
  ASSET_ADDRESS: isTestnet
    ? "0x0000000000000000000000000000000000000000" // Testnet asset address
    : "0x0000000000000000000000000000000000000000", // Mainnet asset address

  TRADE_MODULE_ADDRESS: isTestnet
    ? "0x0000000000000000000000000000000000000000" // Testnet trade module address
    : "0x0000000000000000000000000000000000000000", // Mainnet trade module address

  // Action Type Hash for EIP-712 signing
  ACTION_TYPEHASH:
    "0x0000000000000000000000000000000000000000000000000000000000000000",

  // Domain Separator (computed from domain constants)
  DOMAIN_SEPARATOR: isTestnet
    ? "0x0000000000000000000000000000000000000000000000000000000000000000" // Testnet domain separator
    : "0x0000000000000000000000000000000000000000000000000000000000000000", // Mainnet domain separator
} as const;

// Order Limits and Constraints
export const ORDER_LIMITS = {
  // Size limits
  MIN_ORDER_SIZE: 0.01, // Minimum order size
  MAX_ORDER_SIZE: 1000, // Maximum order size

  // Price limits (in USD)
  MIN_PRICE: 0.0001, // Minimum price per contract
  MAX_PRICE: 100000, // Maximum price per contract

  // Price precision
  PRICE_PRECISION: 4, // Number of decimal places for price
  SIZE_PRECISION: 2, // Number of decimal places for size

  // Order value limits
  MIN_ORDER_VALUE: 1, // Minimum order value in USD
  MAX_ORDER_VALUE: 1000000, // Maximum order value in USD

  // Subaccount limits
  MIN_SUBACCOUNT_ID: 0,
  MAX_SUBACCOUNT_ID: 255,
} as const;

// Timeout Configuration
export const TIMEOUT_CONFIG = {
  // Order submission timeouts (in milliseconds)
  ORDER_SUBMISSION_TIMEOUT: 30000, // 30 seconds
  ORDER_CONFIRMATION_TIMEOUT: 10000, // 10 seconds

  // Authentication timeouts
  AUTH_TIMEOUT: 15000, // 15 seconds
  AUTH_REFRESH_TIMEOUT: 10000, // 10 seconds

  // WebSocket timeouts
  WEBSOCKET_CONNECTION_TIMEOUT: 30000, // 30 seconds
  WEBSOCKET_RESPONSE_TIMEOUT: 15000, // 15 seconds

  // Signature expiry (in seconds from creation)
  SIGNATURE_EXPIRY_SECONDS: 300, // 5 minutes
  DEFAULT_SIGNATURE_EXPIRY: 300, // 5 minutes

  // Retry configuration
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_BASE: 1000, // Base delay for exponential backoff (1 second)
  RETRY_DELAY_MAX: 10000, // Maximum retry delay (10 seconds)
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  // Order parameter validation
  REQUIRED_ORDER_FIELDS: [
    "instrument_name",
    "subaccount_id",
    "direction",
    "limit_price",
    "amount",
    "signature_expiry_sec",
    "max_fee",
    "nonce",
    "signer",
    "order_type",
  ] as const,

  // Instrument name validation
  INSTRUMENT_NAME_PATTERN: /^[A-Z]+-\d{8}-[CP]-\d+$/, // e.g., ETH-20240315-C-3000
  FUTURES_INSTRUMENT_PATTERN: /^[A-Z]+-PERP$/, // e.g., ETH-PERP

  // Direction validation
  VALID_DIRECTIONS: ["buy", "sell"] as const,

  // Order type validation
  VALID_ORDER_TYPES: ["limit", "market"] as const,

  // Price validation rules
  PRICE_STEP_SIZE: 0.0001, // Minimum price increment

  // Size validation rules
  SIZE_STEP_SIZE: 0.01, // Minimum size increment

  // Fee validation
  MAX_FEE_PERCENTAGE: 0.1, // 10% maximum fee
  DEFAULT_MAX_FEE: "1000000000000000000", // 1 ETH in wei as default max fee

  // Nonce validation
  NONCE_MIN_VALUE: 1,
  NONCE_MAX_VALUE: Number.MAX_SAFE_INTEGER,
} as const;

// Environment-specific Configuration
export const ENVIRONMENT_CONFIG = {
  // WebSocket URLs
  WEBSOCKET_URL: isTestnet
    ? "wss://api-demo.lyra.finance/ws"
    : "wss://api.lyra.finance/ws",

  // API endpoints
  REST_API_BASE: isTestnet
    ? "https://api-demo.lyra.finance"
    : "https://api.lyra.finance",

  // Network configuration
  NETWORK_NAME: isTestnet ? "arbitrum-sepolia" : "arbitrum-one",
  CHAIN_ID: isTestnet ? 421614 : 42161,

  // Feature flags
  ENABLE_ORDER_SUBMISSION: true,
  ENABLE_AUTHENTICATION: true,
  ENABLE_REAL_TIME_UPDATES: true,

  // Debug configuration
  DEBUG_MODE: process.env.NODE_ENV === "development",
  LOG_LEVEL: process.env.NODE_ENV === "development" ? "debug" : "info",
} as const;

// Error Messages Configuration
export const ERROR_MESSAGES = {
  // Authentication errors
  AUTH_WALLET_NOT_CONNECTED:
    "Wallet not connected. Please connect your wallet to continue.",
  AUTH_SIGNATURE_FAILED:
    "Failed to generate authentication signature. Please try again.",
  AUTH_SESSION_EXPIRED:
    "Authentication session expired. Please re-authenticate.",
  AUTH_INVALID_SIGNATURE: "Invalid authentication signature.",

  // Order validation errors
  ORDER_INVALID_INSTRUMENT: "Invalid instrument name format.",
  ORDER_INVALID_DIRECTION: 'Order direction must be "buy" or "sell".',
  ORDER_INVALID_SIZE: "Order size must be between {min} and {max}.",
  ORDER_INVALID_PRICE: "Order price must be between {min} and {max}.",
  ORDER_INVALID_SUBACCOUNT: "Subaccount ID must be between {min} and {max}.",
  ORDER_INSUFFICIENT_BALANCE: "Insufficient balance to place this order.",
  ORDER_SIZE_TOO_SMALL: "Order size is below minimum required amount.",
  ORDER_SIZE_TOO_LARGE: "Order size exceeds maximum allowed amount.",
  ORDER_PRICE_TOO_LOW: "Order price is below minimum allowed price.",
  ORDER_PRICE_TOO_HIGH: "Order price exceeds maximum allowed price.",

  // Submission errors
  ORDER_SUBMISSION_FAILED: "Failed to submit order. Please try again.",
  ORDER_SIGNATURE_FAILED:
    "Failed to sign order. Please check your wallet connection.",
  ORDER_NETWORK_ERROR:
    "Network error occurred. Please check your connection and try again.",
  ORDER_TIMEOUT: "Order submission timed out. Please try again.",
  ORDER_REJECTED: "Order was rejected by the exchange.",

  // WebSocket errors
  WEBSOCKET_CONNECTION_FAILED: "Failed to connect to trading server.",
  WEBSOCKET_DISCONNECTED:
    "Connection to trading server lost. Attempting to reconnect...",
  WEBSOCKET_TIMEOUT: "Connection timeout. Please try again.",

  // General errors
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
  INVALID_PARAMETERS: "Invalid parameters provided.",
  OPERATION_CANCELLED: "Operation was cancelled by user.",
} as const;

// Order Status Constants
export const ORDER_STATUS = {
  PENDING: "pending",
  SUBMITTED: "submitted",
  PARTIALLY_FILLED: "partially_filled",
  FILLED: "filled",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
  EXPIRED: "expired",
} as const;

// Order Types
export type OrderDirection = (typeof VALIDATION_RULES.VALID_DIRECTIONS)[number];
export type OrderType = (typeof VALIDATION_RULES.VALID_ORDER_TYPES)[number];
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

// Configuration validation function
export function validateConfiguration(): boolean {
  try {
    // Validate required environment variables
    const requiredEnvVars = [];

    // Check if all required constants are properly set
    if (!DERIVE_PROTOCOL_CONSTANTS.DOMAIN_NAME) {
      console.error("DOMAIN_NAME not configured");
      return false;
    }

    if (!ENVIRONMENT_CONFIG.WEBSOCKET_URL) {
      console.error("WEBSOCKET_URL not configured");
      return false;
    }

    // Validate numeric limits
    if (ORDER_LIMITS.MIN_ORDER_SIZE >= ORDER_LIMITS.MAX_ORDER_SIZE) {
      console.error("Invalid order size limits configuration");
      return false;
    }

    if (ORDER_LIMITS.MIN_PRICE >= ORDER_LIMITS.MAX_PRICE) {
      console.error("Invalid price limits configuration");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Configuration validation failed:", error);
    return false;
  }
}

// Export current environment flag for convenience
export const IS_TESTNET = isTestnet;

// Export configuration object for easy access
export const ORDER_CONFIG = {
  PROTOCOL: DERIVE_PROTOCOL_CONSTANTS,
  LIMITS: ORDER_LIMITS,
  TIMEOUTS: TIMEOUT_CONFIG,
  VALIDATION: VALIDATION_RULES,
  ENVIRONMENT: ENVIRONMENT_CONFIG,
  ERRORS: ERROR_MESSAGES,
  STATUS: ORDER_STATUS,
} as const;
