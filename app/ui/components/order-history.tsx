"use client";

import React, { useState, useEffect } from "react";
import {
  orderService,
  type OrderHistoryItem,
  type OrderResult,
} from "@/app/lib/order-service";
import {
  X,
  Clock,
  CheckCircle,
  XCircle,
  Warning,
  Trash,
} from "@phosphor-icons/react";

interface OrderHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface OrderHistoryState {
  allOrders: OrderHistoryItem[];
  openOrders: OrderHistoryItem[];
  completedOrders: OrderHistoryItem[];
  isLoading: boolean;
  error: string | null;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({
  isOpen,
  onClose,
  className = "",
}) => {
  const [state, setState] = useState<OrderHistoryState>({
    allOrders: [],
    openOrders: [],
    completedOrders: [],
    isLoading: true,
    error: null,
  });
  const [activeTab, setActiveTab] = useState<"all" | "open" | "completed">(
    "all",
  );
  const [cancellingOrders, setCancellingOrders] = useState<Set<string>>(
    new Set(),
  );

  // Load order history on component mount
  useEffect(() => {
    const loadOrderHistory = () => {
      try {
        const allOrders = orderService.getOrderHistory();
        const openOrders = orderService.getOpenOrders();
        const completedOrders = orderService.getCompletedOrders();

        setState({
          allOrders,
          openOrders,
          completedOrders,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load order history",
        }));
      }
    };

    // Initial load
    loadOrderHistory();

    // Subscribe to order history updates
    const unsubscribe = orderService.onOrderHistoryUpdate(() => {
      loadOrderHistory();
    });

    return unsubscribe;
  }, []);

  // Handle order cancellation
  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrders((prev) => new Set(prev).add(orderId));

    try {
      const result = await orderService.cancelOrder(orderId);

      if (!result.success) {
        console.error("Failed to cancel order:", result.error);
        // Error notification is handled by the order service
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

  // Handle cancel all open orders
  const handleCancelAllOrders = async () => {
    const openOrderIds = state.openOrders.map((order) => order.orderId);

    if (openOrderIds.length === 0) return;

    // Add all orders to cancelling set
    setCancellingOrders(new Set(openOrderIds));

    try {
      await orderService.cancelAllOpenOrders();
    } catch (error) {
      console.error("Error cancelling all orders:", error);
    } finally {
      setCancellingOrders(new Set());
    }
  };

  // Get status icon and color
  const getStatusDisplay = (status: string) => {
    const normalizedStatus = status.toLowerCase();

    switch (normalizedStatus) {
      case "filled":
      case "completed":
        return { icon: CheckCircle, color: "text-green-500", label: "Filled" };
      case "partially_filled":
        return { icon: Clock, color: "text-yellow-500", label: "Partial" };
      case "open":
      case "pending":
      case "submitted":
        return { icon: Clock, color: "text-blue-500", label: "Open" };
      case "cancelled":
      case "cancelling":
        return { icon: XCircle, color: "text-gray-500", label: "Cancelled" };
      case "rejected":
      case "expired":
        return { icon: Warning, color: "text-red-500", label: "Rejected" };
      default:
        return { icon: Clock, color: "text-gray-400", label: status };
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return price.toFixed(4);
  };

  // Format amount
  const formatAmount = (amount: number) => {
    return amount.toString();
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get orders to display based on active tab
  const getDisplayOrders = () => {
    switch (activeTab) {
      case "open":
        return state.openOrders;
      case "completed":
        return state.completedOrders;
      default:
        return state.allOrders;
    }
  };

  const displayOrders = getDisplayOrders();

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Order History
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "all"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            All Orders ({state.allOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("open")}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "open"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Open Orders ({state.openOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "completed"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Completed ({state.completedOrders.length})
          </button>
        </div>

        {/* Actions Bar */}
        {activeTab === "open" && state.openOrders.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <button
              onClick={handleCancelAllOrders}
              disabled={cancellingOrders.size > 0}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancellingOrders.size > 0
                ? "Cancelling..."
                : "Cancel All Open Orders"}
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto max-h-[60vh]">
          {state.isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-gray-500 dark:text-gray-400">
                Loading order history...
              </div>
            </div>
          ) : state.error ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-red-500">{state.error}</div>
            </div>
          ) : displayOrders.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-gray-500 dark:text-gray-400">
                {activeTab === "open"
                  ? "No open orders"
                  : activeTab === "completed"
                    ? "No completed orders"
                    : "No orders found"}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Instrument
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Side
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Filled
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {displayOrders.map((order) => {
                    const statusDisplay = getStatusDisplay(order.status);
                    const StatusIcon = statusDisplay.icon;
                    const isCancelling = cancellingOrders.has(order.orderId);
                    const canCancel = [
                      "open",
                      "pending",
                      "partially_filled",
                      "submitted",
                    ].includes(order.status.toLowerCase());

                    return (
                      <tr
                        key={order.orderId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {formatTime(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {order.instrumentName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`font-medium ${
                              order.direction === "buy"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {order.direction.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {formatAmount(order.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {formatPrice(order.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {formatAmount(order.filledAmount)} /{" "}
                          {formatAmount(order.amount)}
                          {order.filledAmount > 0 && (
                            <div className="text-xs text-gray-500">
                              {(
                                (order.filledAmount / order.amount) *
                                100
                              ).toFixed(1)}
                              %
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center">
                            <StatusIcon
                              size={16}
                              className={`mr-2 ${statusDisplay.color}`}
                            />
                            <span className={statusDisplay.color}>
                              {statusDisplay.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {canCancel && (
                            <button
                              onClick={() => handleCancelOrder(order.orderId)}
                              disabled={isCancelling}
                              className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Cancel Order"
                            >
                              {isCancelling ? (
                                <div className="animate-spin w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full" />
                              ) : (
                                <Trash size={16} />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            <div>Showing {displayOrders.length} orders</div>
            <div className="flex space-x-4">
              <div>Open: {state.openOrders.length}</div>
              <div>Completed: {state.completedOrders.length}</div>
              <div>Total: {state.allOrders.length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;
