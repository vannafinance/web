"use client";

import React, { useState, useEffect } from "react";
import {
  orderService,
  type OrderHistoryItem,
  type OrderStatusUpdate,
} from "@/app/lib/order-service";
import {
  CheckCircle,
  Clock,
  XCircle,
  Warning,
  Trash,
} from "@phosphor-icons/react";

interface OrderStatusDisplayProps {
  className?: string;
  maxItems?: number;
  showActions?: boolean;
}

const OrderStatusDisplay: React.FC<OrderStatusDisplayProps> = ({
  className = "",
  maxItems = 5,
  showActions = true,
}) => {
  const [openOrders, setOpenOrders] = useState<OrderHistoryItem[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<OrderStatusUpdate[]>([]);
  const [cancellingOrders, setCancellingOrders] = useState<Set<string>>(
    new Set(),
  );

  // Load and subscribe to order updates
  useEffect(() => {
    const updateOrderData = () => {
      const orders = orderService.getOpenOrders().slice(0, maxItems);
      setOpenOrders(orders);
    };

    // Initial load
    updateOrderData();

    // Subscribe to order history updates
    const unsubscribeHistory = orderService.onOrderHistoryUpdate(() => {
      updateOrderData();
    });

    // Subscribe to real-time order updates
    const unsubscribeUpdates = orderService.onOrderUpdate((update) => {
      setRecentUpdates((prev) => {
        const newUpdates = [
          update,
          ...prev.filter((u) => u.orderId !== update.orderId),
        ];
        return newUpdates.slice(0, maxItems);
      });
    });

    return () => {
      unsubscribeHistory();
      unsubscribeUpdates();
    };
  }, [maxItems]);

  // Handle order cancellation
  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrders((prev) => new Set(prev).add(orderId));

    try {
      const result = await orderService.cancelOrder(orderId);

      if (!result.success) {
        console.error("Failed to cancel order:", result.error);
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
    } finally {
      setCancellingOrders((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // Get status icon and color
  const getStatusDisplay = (status: string) => {
    const normalizedStatus = status.toLowerCase();

    switch (normalizedStatus) {
      case "filled":
      case "completed":
        return {
          icon: CheckCircle,
          color: "text-green-500",
          bgColor: "bg-green-100 dark:bg-green-900/20",
        };
      case "partially_filled":
        return {
          icon: Clock,
          color: "text-yellow-500",
          bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
        };
      case "open":
      case "pending":
      case "submitted":
        return {
          icon: Clock,
          color: "text-blue-500",
          bgColor: "bg-blue-100 dark:bg-blue-900/20",
        };
      case "cancelled":
      case "cancelling":
        return {
          icon: XCircle,
          color: "text-gray-500",
          bgColor: "bg-gray-100 dark:bg-gray-900/20",
        };
      case "rejected":
      case "expired":
        return {
          icon: Warning,
          color: "text-red-500",
          bgColor: "bg-red-100 dark:bg-red-900/20",
        };
      default:
        return {
          icon: Clock,
          color: "text-gray-400",
          bgColor: "bg-gray-100 dark:bg-gray-900/20",
        };
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return price.toFixed(4);
  };

  // Format time
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) {
      // Less than 1 minute
      return "Just now";
    } else if (diff < 3600000) {
      // Less than 1 hour
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) {
      // Less than 1 day
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  };

  if (openOrders.length === 0 && recentUpdates.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Open Orders */}
      {openOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Open Orders ({openOrders.length})
            </h3>
          </div>
          <div className="space-y-2">
            {openOrders.map((order) => {
              const statusDisplay = getStatusDisplay(order.status);
              const StatusIcon = statusDisplay.icon;
              const isCancelling = cancellingOrders.has(order.orderId);

              return (
                <div
                  key={order.orderId}
                  className={`p-3 rounded-lg border ${statusDisplay.bgColor} border-gray-200 dark:border-gray-700`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <StatusIcon size={16} className={statusDisplay.color} />
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {order.direction.toUpperCase()} {order.amount}{" "}
                          {order.instrumentName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          @ {formatPrice(order.price)} •{" "}
                          {formatTime(order.createdAt)}
                        </div>
                      </div>
                    </div>

                    {showActions && (
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs font-medium ${statusDisplay.color}`}
                        >
                          {order.status.toUpperCase()}
                        </span>
                        {[
                          "open",
                          "pending",
                          "partially_filled",
                          "submitted",
                        ].includes(order.status.toLowerCase()) && (
                          <button
                            onClick={() => handleCancelOrder(order.orderId)}
                            disabled={isCancelling}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Cancel Order"
                          >
                            {isCancelling ? (
                              <div className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full" />
                            ) : (
                              <Trash size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Progress bar for partially filled orders */}
                  {order.filledAmount > 0 &&
                    order.filledAmount < order.amount && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span>
                            Filled: {order.filledAmount} / {order.amount}
                          </span>
                          <span>
                            {(
                              (order.filledAmount / order.amount) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                            style={{
                              width: `${(order.filledAmount / order.amount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Updates */}
      {recentUpdates.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Recent Updates
            </h3>
          </div>
          <div className="space-y-2">
            {recentUpdates.map((update, index) => {
              const statusDisplay = getStatusDisplay(update.status);
              const StatusIcon = statusDisplay.icon;

              return (
                <div
                  key={`${update.orderId}-${index}`}
                  className={`p-2 rounded-lg border ${statusDisplay.bgColor} border-gray-200 dark:border-gray-700`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <StatusIcon size={14} className={statusDisplay.color} />
                      <div className="text-xs">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          Order {update.orderId.slice(0, 8)}...
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {formatTime(update.timestamp)}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium ${statusDisplay.color}`}
                    >
                      {update.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderStatusDisplay;
