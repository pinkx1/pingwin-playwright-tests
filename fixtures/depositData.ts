export const depositMethods: Record<string, string[]> = {
  USD: [
    'Binance Pay',
    'Tether USD (Tron)',
    'Tether USD (Ethereum)',
    'Bitcoin',
    'Ethereum',
    'Tron',
    'Toncoin'
  ],
  EUR: [
    'Банковская карта (от €6)',
    'Банковская карта (от €10)',
    'Binance Pay',
    'Банковская карта (от €10)',
    'Банковская карта (от €6)',
    'Tether USD (Tron)',
    'Tether USD (Ethereum)',
    'Bitcoin',
    'Ethereum',
    'Tron',
    'Toncoin'
  ],
  UAH: [
    'ПриватБанк и оплата по QR',
    'Банковская карта (от 300₴, P2P)',
    'Binance Pay',
    'Банковская карта (от 500₴, P2P)',
    'Tether USD (Tron)',
    'Tether USD (Ethereum)',
    'Bitcoin',
    'Ethereum',
    'Tron',
    'Toncoin'
  ],
  KZT: [
    'Binance Pay',
    'Tether USD (Tron)',
    'Tether USD (Ethereum)',
    'Bitcoin',
    'Ethereum',
    'Tron',
    'Toncoin'
  ],
  RON: [
    'Банковская карта (от 30 RON)',
    'Банковская карта (от €10)',
    'Binance Pay',
    'Банковская карта (от €10)',
    'Банковская карта (от €6)',
    'Tether USD (Tron)',
    'Tether USD (Ethereum)',
    'Bitcoin',
    'Ethereum',
    'Tron',
    'Toncoin'
  ],
  UZS: [
    'Банковская карта UZS (P2P)',
    'Банковская карта UZS',
    'Binance Pay',
    'Банковская карта (UZS, P2P)',
    'Tether USD (Tron)',
    'Tether USD (Ethereum)',
    'Bitcoin',
    'Ethereum',
    'Tron',
    'Toncoin'
  ]
};

export const minDeposit: Record<string, Record<string, number>> = {
  USD: {
    'Binance Pay': 3,
    'Tether USD (Tron)': 10.82,
    'Tether USD (Ethereum)': 14.85,
    'Bitcoin': 0,
    'Ethereum': 0,
    'Tron': 35.04,
    'Toncoin': 3.31
  },
  EUR: {
    'Банковская карта (от €6)': 6,
    'Банковская карта (от €10)': 10,
    'Binance Pay': 3
  },
  UAH: {
    'ПриватБанк и оплата по QR': 300,
    'Банковская карта (от 300₴, P2P)': 300,
    'Binance Pay': 124
  },
  KZT: {
    'Binance Pay': 1604
  },
  RON: {
    'Банковская карта (от 30 RON)': 30,
    'Банковская карта (от €10)': 10,
    'Binance Pay': 14,
    'Банковская карта (от €6)': 6
  },
  UZS: {
    'Банковская карта UZS (P2P)': 30000,
    'Банковская карта UZS': 5000,
    'Binance Pay': 37493,
    'Банковская карта (UZS, P2P)': 10000
  }
};
