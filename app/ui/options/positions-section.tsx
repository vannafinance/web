"use client";

import React, { useState, useEffect } from "react";
import { orderService, type OrderHistoryItem } from "@/app/lib/order-service";
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Trash,
} from "@phosphor-icons/react";

// Positions Component
const PositionsComponent = () => (
  <div className="p-4">
    <div className="text-center text-gray-500 dark:text-gray-400">
      <div className="mb-2">No positions found</div>
      <div className="text-sm">Your option positions will appear here</div>
    </div>
  </div>
);

// Open Orders Component
const OpenOrdersComponent = () => {
  const [openOrders, setOpenOrders] = useState<OrderHistoryItem[]>([]);
  const [cancellingOrders, setCancellingOrders] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateOpenOrders = () => {
      const orders = orderService.getOpenOrders();
      setOpenOrders(orders);
      setIsLoading(false);
    };

    updateOpenOrders();
    const unsubscribe = orderService.onOrderHistoryUpdate(updateOpenOrders);
    return unsubscribe;
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrders((prev) => new Set(prev).add(orderId));
    try {
      await orderService.cancelOrder(orderId);
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

  const handleCancelAllOrders = async () => {
    const orderIds = openOrders.map((order) => order.orderId);
    setCancellingOrders(new Set(orderIds));
    try {
      await orderService.cancelAllOpenOrders();
    } catch (error) {
      console.error("Error cancelling all orders:", error);
    } finally {
      setCancellingOrders(new Set());
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="text-gray-500 dark:text-gray-400">
          Loading open orders...
        </div>
      </div>
    );
  }

  if (openOrders.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <div className="mb-2">No open orders</div>
        <div className="text-sm">Your pending orders will appear here</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Open Orders ({openOrders.length})
        </h3>
        <button
          onClick={handleCancelAllOrders}
          disabled={cancellingOrders.size > 0}
          className="px-3 py-1 text-sm text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancellingOrders.size > 0 ? "Cancelling..." : "Cancel All"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                Time
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                Instrument
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                Side
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                Size
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                Price
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                Filled
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {openOrders.map((order) => {
              const isCancelling = cancellingOrders.has(order.orderId);
              return (
                <tr
                  key={order.orderId}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-300">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-300">
                    {order.instrumentName}
                  </td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-300">
                    {order.amount}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-300">
                    {order.price.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-300">
                    {order.filledAmount} / {order.amount}
                    {order.filledAmount > 0 && (
                      <div className="text-xs text-gray-500">
                        {((order.filledAmount / order.amount) * 100).toFixed(1)}
                        %
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1 text-blue-500" />
                      <span className="text-blue-500 text-sm">
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Order History Component
const OrderHistoryComponent = () => {
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateOrderHistory = () => {
      const history = orderService.getOrderHistory();
      setOrderHistory(history);
      setIsLoading(false);
    };

    updateOrderHistory();
    const unsubscribe = orderService.onOrderHistoryUpdate(updateOrderHistory);
    return unsubscribe;
  }, []);

  const getStatusDisplay = (status: string) => {
    const normalizedStatus = status.toLowerCase();

    switch (normalizedStatus) {
      case "filled":
      case "completed":
        return { icon: CheckCircle, color: "text-green-500" };
      case "partially_filled":
        return { icon: Clock, color: "text-yellow-500" };
      case "open":
      case "pending":
      case "submitted":
        return { icon: Clock, color: "text-blue-500" };
      case "cancelled":
      case "cancelling":
        return { icon: XCircle, color: "text-gray-500" };
      case "rejected":
      case "expired":
        return { icon: AlertCircle, color: "text-red-500" };
      default:
        return { icon: Clock, color: "text-gray-400" };
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="text-gray-500 dark:text-gray-400">
          Loading order history...
        </div>
      </div>
    );
  }

  if (orderHistory.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <div className="mb-2">No order history</div>
        <div className="text-sm">Your completed orders will appear here</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Order History ({orderHistory.length})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                Time
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                Instrument
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                Side
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                Size
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                Price
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                Filled
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                Avg Price
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                Fee
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {orderHistory.map((order) => {
              const statusDisplay = getStatusDisplay(order.status);
              const StatusIcon = statusDisplay.icon;

              return (
                <tr
                  key={order.orderId}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-300">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-300">
                    {order.instrumentName}
                  </td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-300">
                    {order.amount}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-300">
                    {order.price.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-300">
                    {order.filledAmount} / {order.amount}
                    {order.filledAmount > 0 && (
                      <div className="text-xs text-gray-500">
                        {((order.filledAmount / order.amount) * 100).toFixed(1)}
                        %
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-300">
                    {order.averagePrice ? order.averagePrice.toFixed(4) : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-300">
                    {order.fee.toFixed(4)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <StatusIcon
                        size={14}
                        className={`mr-1 ${statusDisplay.color}`}
                      />
                      <span className={`text-sm ${statusDisplay.color}`}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Trade History Component
const TradeHistoryComponent = () => (
  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
    <div className="mb-2">No trade history</div>
    <div className="text-sm">Your executed trades will appear here</div>
  </div>
);

// Transaction History Component
const TransactionHistoryComponent = () => (
  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
    <div className="mb-2">No transaction history</div>
    <div className="text-sm">Your account transactions will appear here</div>
  </div>
);

// Position History Component
const PositionHistoryComponent = () => (
  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
    <div className="mb-2">No position history</div>
    <div className="text-sm">Your historical positions will appear here</div>
  </div>
);

const PositionsSection = () => {
  const [activeTab, setActiveTab] = useState("Positions");
  const [openOrdersCount, setOpenOrdersCount] = useState(0);
  const [orderHistoryCount, setOrderHistoryCount] = useState(0);

  // Update counts when order data changes
  useEffect(() => {
    const updateCounts = () => {
      const openOrders = orderService.getOpenOrders();
      const orderHistory = orderService.getOrderHistory();
      setOpenOrdersCount(openOrders.length);
      setOrderHistoryCount(orderHistory.length);
    };

    updateCounts();
    const unsubscribe = orderService.onOrderHistoryUpdate(updateCounts);
    return unsubscribe;
  }, []);

  const navItems = [
    { name: "Positions", count: 0, component: PositionsComponent },
    {
      name: "Open Orders",
      count: openOrdersCount,
      component: OpenOrdersComponent,
    },
    {
      name: "Order History",
      count: orderHistoryCount,
      component: OrderHistoryComponent,
    },
    { name: "Trade History", count: null, component: TradeHistoryComponent },
    {
      name: "Transaction History",
      count: null,
      component: TransactionHistoryComponent,
    },
    {
      name: "Position History",
      count: null,
      component: PositionHistoryComponent,
    },
  ];

  const ActiveComponent =
    navItems.find((item) => item.name === activeTab)?.component || (() => null);

  return (
    <div className="border border-neutral-100 dark:border-neutral-700 rounded-xl p-1">
      <nav className="border-b border-neutral-100 dark:border-neutral-700">
        <ul className="flex overflow-x-auto">
          {navItems.map((item) => (
            <li key={item.name} className="flex-shrink-0">
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === item.name
                    ? "text-purple border-b-2 border-purple"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
                onClick={() => setActiveTab(item.name)}
              >
                {item.name}
                {item.count !== null && (
                  <span className="ml-1 text-xs">({item.count})</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="min-h-[300px]">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default PositionsSection;
