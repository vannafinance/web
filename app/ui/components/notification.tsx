"use client";

import React, { useEffect } from "react";
import { X, CheckCircle, WarningCircle, Info } from "@phosphor-icons/react";

const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle size={20} color="#4ade80" weight="fill" />,
    error: <WarningCircle size={20} color="#f87171" weight="fill" />,
    info: <Info size={20} color="#60a5fa" weight="fill" />,
  };

  const colors = {
    success: "bg-green-50 text-green-800 border-green-200",
    error: "bg-red-50 text-red-800 border-red-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
  };

  return (
    <div
      className={`flex items-center p-4 mb-4 border-l-4 rounded-r-lg ${colors[type]}`}
      role="alert"
    >
      <div className="ml-3 text-sm font-medium">{icons[type]}</div>
      <div className="ml-3 text-sm font-medium">{message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex h-8 w-8"
        onClick={onClose}
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <X className="w-5 h-5" weight="bold" />
      </button>
    </div>
  );
};

export default Notification;

// const [notifications, setNotifications] = useState<Array<{ id: number; type: NotificationType; message: string }>>([]);

// const addNotification = (type: NotificationType, message: string) => {
//   const id = Date.now();
//   setNotifications(prev => [...prev, { id, type, message }]);
// };

// const removeNotification = (id: number) => {
//   setNotifications(prev => prev.filter(notification => notification.id !== id));
// };

// <div className="fixed bottom-5 left-5 w-72">
// {notifications.map(({ id, type, message }) => (
//   <Notification
//     key={id}
//     type={type}
//     message={message}
//     onClose={() => removeNotification(id)}
//     duration={10000}
//   />
// ))}
// </div>
