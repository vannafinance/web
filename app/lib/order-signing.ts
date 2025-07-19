/**
 * Order Signing Service for Derive Protocol
 *
 * This service handles cryptographic signing of orders according to Derive protocol specifications.
 * It implements EIP-712 typed data signing with proper domain separation and data encoding.
 */

import { ethers } from "ethers";
import {
  ORDER_CONFIG,
  DERIVE_PROTOCOL_CONSTANTS,
  VALIDATION_RULES,
} from "./order-config";
import {
  orderValidator,
  getDefaultOrderLimits,
  type DetailedValidationResult,
} from "./order-validation";

// Types for order parameters
export interface OrderParams {
  instrument_name: string;
  subaccount_id: number;
  direction: "buy" | "sell";
  limit_price: number;
  amount: number;
  signature_expiry_sec: number;
  max_fee: string;
  nonce: number;
  signer: string;
  order_type: "limit" | "market";
  mmp: boolean;
}

export interface SignedOrder extends OrderParams {
  signature: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// EIP-712 Domain for Derive Protocol
const EIP712_DOMAIN = {
  name: DERIVE_PROTOCOL_CONSTANTS.DOMAIN_NAME,
  version: DERIVE_PROTOCOL_CONSTANTS.DOMAIN_VERSION,
  chainId: DERIVE_PROTOCOL_CONSTANTS.DOMAIN_CHAIN_ID,
  verifyingContract: DERIVE_PROTOCOL_CONSTANTS.TRADE_MODULE_ADDRESS,
};

// EIP-712 Types for Order
const EIP712_TYPES = {
  Order: [
    { name: "instrument_name", type: "string" },
    { name: "subaccount_id", type: "uint256" },
    { name: "direction", type: "string" },
    { name: "limit_price", type: "uint256" },
    { name: "amount", type: "uint256" },
    { name: "signature_expiry_sec", type: "uint256" },
    { name: "max_fee", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "signer", type: "address" },
    { name: "order_type", type: "string" },
    { name: "mmp", type: "bool" },
  ],
};

export class OrderSigningService {
  /**
   * Signs an order using EIP-712 typed data signing
   */
  async signOrder(
    order: OrderParams,
    signer: ethers.Signer,
  ): Promise<SignedOrder> {
    try {
      // Validate order parameters first
      const validation = this.validateOrderParams(order);
      if (!validation.isValid) {
        throw new Error(
          `Order validation failed: ${validation.errors.join(", ")}`,
        );
      }

      // Encode trade data for signing
      const encodedOrder = this.encodeTradeData(order);

      // Generate action hash with domain separation
      const actionHash = this.generateActionHash(order);

      // Create EIP-712 typed data structure
      const typedData = {
        domain: EIP712_DOMAIN,
        types: EIP712_TYPES,
        primaryType: "Order",
        message: encodedOrder,
      };

      // Sign the typed data
      const signature = await signer._signTypedData(
        typedData.domain,
        typedData.types,
        typedData.message,
      );

      return {
        ...order,
        signature,
      };
    } catch (error) {
      throw new Error(
        `Failed to sign order: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Encodes trade data according to Derive protocol specifications
   */
  encodeTradeData(order: OrderParams): Record<string, any> {
    try {
      // Convert numeric values to proper format for EIP-712
      const encodedOrder = {
        instrument_name: order.instrument_name,
        subaccount_id: ethers.BigNumber.from(order.subaccount_id),
        direction: order.direction,
        limit_price: this.encodePriceToWei(order.limit_price),
        amount: this.encodeAmountToWei(order.amount),
        signature_expiry_sec: ethers.BigNumber.from(order.signature_expiry_sec),
        max_fee: ethers.BigNumber.from(order.max_fee),
        nonce: ethers.BigNumber.from(order.nonce),
        signer: order.signer,
        order_type: order.order_type,
        mmp: order.mmp,
      };

      return encodedOrder;
    } catch (error) {
      throw new Error(
        `Failed to encode trade data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generates action hash with proper domain separation
   */
  generateActionHash(order: OrderParams): string {
    try {
      // Create a hash of the order data for action identification
      const orderDataString = JSON.stringify({
        instrument: order.instrument_name,
        subaccount: order.subaccount_id,
        direction: order.direction,
        price: order.limit_price,
        amount: order.amount,
        nonce: order.nonce,
        signer: order.signer,
      });

      // Generate hash with domain separation
      const actionData = ethers.utils.defaultAbiCoder.encode(
        ["string", "string", "uint256"],
        [DERIVE_PROTOCOL_CONSTANTS.DOMAIN_NAME, orderDataString, order.nonce],
      );

      const actionHash = ethers.utils.keccak256(actionData);
      return actionHash;
    } catch (error) {
      throw new Error(
        `Failed to generate action hash: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generates a unique nonce using timestamp + random number format
   */
  generateNonce(): number {
    try {
      // Use timestamp (in seconds) + random number for uniqueness
      const timestamp = Math.floor(Date.now() / 1000);
      const randomComponent = Math.floor(Math.random() * 1000000); // 6-digit random number

      // Combine timestamp and random component
      // Format: timestamp (10 digits) + random (6 digits)
      const nonce = timestamp * 1000000 + randomComponent;

      // Ensure nonce is within safe integer range
      if (nonce > Number.MAX_SAFE_INTEGER) {
        throw new Error("Generated nonce exceeds safe integer range");
      }

      return nonce;
    } catch (error) {
      throw new Error(
        `Failed to generate nonce: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Validates order parameters according to Derive protocol requirements
   * Uses the enhanced validation utilities for comprehensive validation
   */
  validateOrderParams(
    order: OrderParams,
    availableBalance?: number,
  ): ValidationResult {
    try {
      // Use the enhanced validator for comprehensive validation
      const limits = getDefaultOrderLimits();
      const detailedResult = orderValidator.validateCompleteOrder(
        order,
        limits,
        availableBalance,
      );

      // Convert detailed validation result to simple format for backward compatibility
      const errors = detailedResult.errors.map((error) => error.message);

      // Add warnings as informational errors (non-blocking)
      if (detailedResult.warnings.length > 0) {
        // Warnings don't make validation fail, but we can log them
        console.warn("Order validation warnings:", detailedResult.warnings);
      }

      return {
        isValid: detailedResult.isValid,
        errors,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [
          `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
      };
    }
  }

  /**
   * Enhanced validation that returns detailed results including warnings
   */
  validateOrderParamsDetailed(
    order: OrderParams,
    availableBalance?: number,
  ): DetailedValidationResult {
    try {
      const limits = getDefaultOrderLimits();
      return orderValidator.validateCompleteOrder(
        order,
        limits,
        availableBalance,
      );
    } catch (error) {
      return {
        isValid: false,
        errors: [
          {
            field: "validation",
            message: `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
            code: "VALIDATION_ERROR",
          },
        ],
        warnings: [],
      };
    }
  }

  /**
   * Validates instrument name format according to Derive specifications
   */
  private validateInstrumentName(instrumentName: string): boolean {
    // Check for options format: ETH-20240315-C-3000
    if (VALIDATION_RULES.INSTRUMENT_NAME_PATTERN.test(instrumentName)) {
      return true;
    }

    // Check for futures format: ETH-PERP
    if (VALIDATION_RULES.FUTURES_INSTRUMENT_PATTERN.test(instrumentName)) {
      return true;
    }

    return false;
  }

  /**
   * Converts price to wei format for blockchain compatibility
   */
  private encodePriceToWei(price: number): ethers.BigNumber {
    try {
      // Convert price to wei (assuming 18 decimal places)
      const priceString = price.toFixed(18);
      return ethers.utils.parseEther(priceString);
    } catch (error) {
      throw new Error(
        `Failed to encode price to wei: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Converts amount to wei format for blockchain compatibility
   */
  private encodeAmountToWei(amount: number): ethers.BigNumber {
    try {
      // Convert amount to wei (assuming 18 decimal places)
      const amountString = amount.toFixed(18);
      return ethers.utils.parseEther(amountString);
    } catch (error) {
      throw new Error(
        `Failed to encode amount to wei: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Creates a complete order with generated nonce and expiry
   */
  createOrderParams(
    instrumentName: string,
    subaccountId: number,
    direction: "buy" | "sell",
    limitPrice: number,
    amount: number,
    signer: string,
    orderType: "limit" | "market" = "limit",
    mmp: boolean = false,
    maxFee?: string,
  ): OrderParams {
    const currentTime = Math.floor(Date.now() / 1000);

    return {
      instrument_name: instrumentName,
      subaccount_id: subaccountId,
      direction,
      limit_price: limitPrice,
      amount,
      signature_expiry_sec:
        currentTime + ORDER_CONFIG.TIMEOUTS.DEFAULT_SIGNATURE_EXPIRY,
      max_fee: maxFee || VALIDATION_RULES.DEFAULT_MAX_FEE,
      nonce: this.generateNonce(),
      signer,
      order_type: orderType,
      mmp,
    };
  }
}

// Export singleton instance
export const orderSigningService = new OrderSigningService();
