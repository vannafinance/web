/**
 * Order Configuration and Constants for Derive Protocol
 */

// Order configuration constants
export const ORDER_CONFIG = {
  TIMEOUTS: {
    WEBSOCKET_CONNECTION_TIMEOUT: 30000, // 30 seconds
    DEFAULT_SIGNATURE_EXPIRY: 600, // 10 minutes
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY_BASE: 1000, // 1 second
    RETRY_DELAY_MAX: 10000, // 10 seconds
  },
  LIMITS: {
    MIN_ORDER_SIZE: 0.01,
    MAX_ORDER_SIZE: 1000000,
    MIN_PRICE: 0.01,
    MAX_PRICE: 1000000,
  },
  ERRORS: {
    AUTH_WALLET_NOT_CONNECTED: "Wallet not connected",
    AUTH_SESSION_EXPIRED: "Authentication session expired",
    WEBSOCKET_CONNECTION_FAILED: "WebSocket connection failed",
    ORDER_INSUFFICIENT_BALANCE: "Insufficient balance for order",
  },
};

// Derive Protocol Constants
export const DERIVE_PROTOCOL_CONSTANTS = {
  DOMAIN_NAME: "Derive Protocol",
  DOMAIN_VERSION: "1",
  DOMAIN_CHAIN_ID: 8453, // Base mainnet
  TRADE_MODULE_ADDRESS: "0x87F2863866D85E3192a35A73b388BD625D83f2be",
};

// Validation rules
export const VALIDATION_RULES = {
  INSTRUMENT_NAME_PATTERN: /^[A-Z]+-\d{8}-[CP]-\d+$/,
  FUTURES_INSTRUMENT_PATTERN: /^[A-Z]+-PERP$/,
  DEFAULT_MAX_FEE: "0.01",
};
