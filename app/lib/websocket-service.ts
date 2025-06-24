import { EventEmitter } from 'events';

class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 3000; // 3 seconds

  constructor() {
    super();
  }

  connect() {
    try {
      this.ws = new WebSocket('wss://api.lyra.finance/ws');

      this.ws.onopen = () => {
        console.log('WebSocket Connected');
        this.reconnectAttempts = 0;
        this.subscribe();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Filter only real data updates with instrument_ticker
          if (data.method === 'subscription' && data.params?.data?.instrument_ticker) {
            console.log('Live data received:', data);
            this.emit('optionsData', [data]); // send wrapped in array
          } else {
            console.log('Ignored message:', data);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket Disconnected');
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        this.handleReconnect();
      };
    } catch (error) {
      console.error('WebSocket Connection Error:', error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting attempt ${this.reconnectAttempts}...`);
      setTimeout(() => this.connect(), this.reconnectTimeout);
    } else {
      console.error('Max reconnect attempts reached. Giving up.');
    }
  }

  private subscribe() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const subscribeMessage = {
        method: 'subscribe',
        params: {
          channels: [
            'ticker.BTC-20250627-320000-C.1000',
            'ticker.BTC-20250627-320000-P.1000'
          ]
        },
        id: 1,
        jsonrpc: '2.0'
      };
      this.ws.send(JSON.stringify(subscribeMessage));
      console.log('Subscribed to channels');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsService = new WebSocketService();