/**
 * Order Signing Service for Derive Protocol
 *
 * This service handles cryptographic signing of orders according to Derive protocol specifications.
 * It implements the exact signing flow as documented in the Derive API reference.
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

// Types for order parameters - matching Derive API exactly
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

// Derive Protocol Constants from documentation
const ACTION_TYPEHASH =
  "0x4d7a9f27c403ff9c0f19bce61d76d82f9aa29f8d6d4b0c5474607d9770d1af17";
const DOMAIN_SEPARATOR =
  "0x9bcf4dc06df5d8bf23af818d5716491b995020f377d3b7b64c29ed14e3dd1105";
const ASSET_ADDRESS = "0xBcB494059969DAaB460E0B5d4f5c2366aab79aa1"; // ETH asset address
const TRADE_MODULE_ADDRESS = "0x87F2863866D85E3192a35A73b388BD625D83f2be";

export class OrderSigningService {
  private encoder = ethers.utils.defaultAbiCoder;

  /**
   * Signs an order using the exact Derive protocol signing flow
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

      // Get instrument details (we'll need to fetch OPTION_SUB_ID from the API)
      const instrumentDetails = await this.getInstrumentDetails(
        order.instrument_name,
      );

      // Step 1: Encode trade data according to Derive specification
      const tradeModuleData = this.encodeTradeData(
        order,
        instrumentDetails.subId,
      );

      // Step 2: Generate action hash
      const actionHash = this.generateActionHash(order, tradeModuleData);

      // Step 3: Create typed data hash for signing
      const typedDataHash = this.createTypedDataHash(actionHash);

      // Step 4: Sign the hash
      const signature = await this.signHash(typedDataHash, signer);

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
   * Get instrument details including sub ID
   */
  private async getInstrumentDetails(
    instrumentName: string,
  ): Promise<{ subId: string }> {
    try {
      // Import deriveAPI to get instrument details
      const { deriveAPI } = await import("./derive-api");

      // This would call public/get_instrument to get the sub ID
      // For now, we'll use a placeholder - in real implementation this should be fetched
      return {
        subId: "644245094401698393600", // This should be fetched from the API
      };
    } catch (error) {
      throw new Error(
        `Failed to get instrument details: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Encodes trade data according to Derive protocol specifications
   * This matches the exact encoding from the documentation
   */
  private encodeTradeData(order: OrderParams, optionSubId: string): string {
    try {
      // Encode data exactly as shown in Derive documentation
      const encodedData = this.encoder.encode(
        ["address", "uint", "int", "int", "uint", "uint", "bool"],
        [
          ASSET_ADDRESS,
          optionSubId,
          ethers.utils.parseUnits(order.limit_price.toString(), 18),
          ethers.utils.parseUnits(order.amount.toString(), 18),
          ethers.utils.parseUnits(order.max_fee.toString(), 18),
          order.subaccount_id,
          order.direction === "buy",
        ],
      );

      // Return keccak256 hash of the encoded data
      return ethers.utils.keccak256(Buffer.from(encodedData.slice(2), "hex"));
    } catch (error) {
      throw new Error(
        `Failed to encode trade data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generates action hash exactly as shown in Derive documentation
   */
  private generateActionHash(
    order: OrderParams,
    tradeModuleData: string,
  ): string {
    try {
      // Generate action hash exactly as shown in documentation
      const actionHash = ethers.utils.keccak256(
        this.encoder.encode(
          [
            "bytes32",
            "uint256",
            "uint256",
            "address",
            "bytes32",
            "uint256",
            "address",
            "address",
          ],
          [
            ACTION_TYPEHASH,
            order.subaccount_id,
            order.nonce,
            TRADE_MODULE_ADDRESS,
            tradeModuleData,
            order.signature_expiry_sec,
            order.signer, // wallet address
            order.signer, // signer address (same as wallet for now)
          ],
        ),
      );

      return actionHash;
    } catch (error) {
      throw new Error(
        `Failed to generate action hash: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Creates typed data hash for signing exactly as shown in Derive documentation
   */
  private createTypedDataHash(actionHash: string): string {
    try {
      // Create typed data hash exactly as shown in documentation
      const typedDataHash = ethers.utils.keccak256(
        Buffer.concat([
          Buffer.from("1901", "hex"),
          Buffer.from(DOMAIN_SEPARATOR.slice(2), "hex"),
          Buffer.from(actionHash.slice(2), "hex"),
        ]),
      );

      return typedDataHash;
    } catch (error) {
      throw new Error(
        `Failed to create typed data hash: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Signs the hash using wallet's signing key
   */
  private async signHash(hash: string, signer: ethers.Signer): Promise<string> {
    try {
      // For ethers v5, we need to use the signing key directly
      const wallet = signer as ethers.Wallet;
      if (!wallet.signingKey) {
        throw new Error("Signer must be a wallet with signing key");
      }

      const signature = wallet.signingKey.sign(hash);
      return signature.serialized;
    } catch (error) {
      throw new Error(
        `Failed to sign hash: ${error instanceof Error ? error.message : "Unknown error"}`,
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
