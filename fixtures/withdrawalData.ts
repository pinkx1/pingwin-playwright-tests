export const withdrawalMethods: Record<string, string[]> = {
  USD: [
    'Выплата на Binance BinPay',
    'Tether USD (Tron)',
    'Tether USD (Ethereum)',
    'Bitcoin',
    'Ethereum',
    'Tron',
    'Toncoin'
  ],
  EUR: [
    'Выплата на Binance BinPay',
    'Выплата на карту (от €5)',
    'Выплата на карту (от €5)',
    'Tether USD (Tron)',
    'Tether USD (Ethereum)',
    'Bitcoin',
    'Ethereum',
    'Tron',
    'Toncoin'
  ],
  UAH: [
    'Выплата на Binance BinPay',
    'Выплата на карту (от 1000₴)',
    'Выплата на IBAN (от 500₴)',
    'Tether USD (Tron)',
    'Tether USD (Ethereum)',
    'Bitcoin',
    'Ethereum',
    'Tron',
    'Toncoin'
  ],
  KZT: [
    'Выплата на Binance BinPay',
    'Tether USD (Tron)',
    'Tether USD (Ethereum)',
    'Bitcoin',
    'Ethereum',
    'Tron',
    'Toncoin'
  ],
  RON: [
    'Выплата на Binance BinPay',
    'Выплата на карту (от €5)',
    'Выплата на карту (от €5)',
    'Tether USD (Tron)',
    'Tether USD (Ethereum)',
    'Bitcoin',
    'Ethereum',
    'Tron',
    'Toncoin'
  ],
  UZS: [
    'Выплата на Binance BinPay',
    'Выплата на банковскую карту',
    'Tether USD (Tron)',
    'Tether USD (Ethereum)',
    'Bitcoin',
    'Ethereum',
    'Tron',
    'Toncoin'
  ]
};

export const withdrawalLimits: Record<string, Record<string, { min: number; max: number }>> = {
  USD: {
    'Выплата на Binance BinPay': { min: 1, max: 27 },
    'Tether USD (Tron)': { min: 11, max: 27 },
    'Tether USD (Ethereum)': { min: 1, max: 27 },
    'Bitcoin': { min: 2, max: 27 },
    'Ethereum': { min: 1, max: 27 },
    'Tron': { min: 1, max: 27 },
    'Toncoin': { min: 1, max: 27 }
  },
  EUR: {
    'Выплата на Binance BinPay': { min: 1, max: 24 },
    'Выплата на карту (от €5)': { min: 5, max: 24 },
    'Tether USD (Tron)': { min: 10, max: 24 },
    'Tether USD (Ethereum)': { min: 1, max: 24 },
    'Bitcoin': { min: 1, max: 24 },
    'Ethereum': { min: 1, max: 24 },
    'Tron': { min: 1, max: 24 },
    'Toncoin': { min: 1, max: 24 }
  },
  UAH: {
    'Выплата на Binance BinPay': { min: 42, max: 1165 },
    'Выплата на карту (от 1000₴)': { min: 1000, max: 1165 },
    'Выплата на IBAN (от 500₴)': { min: 500, max: 1165 },
    'Tether USD (Tron)': { min: 439, max: 1165 },
    'Tether USD (Ethereum)': { min: 26, max: 1165 },
    'Bitcoin': { min: 46, max: 1165 },
    'Ethereum': { min: 13, max: 1165 },
    'Tron': { min: 13, max: 1165 },
    'Toncoin': { min: 3, max: 1165 }
  },
  KZT: {
    'Выплата на Binance BinPay': { min: 540, max: 15078 },
    'Tether USD (Tron)': { min: 5668, max: 15078 },
    'Tether USD (Ethereum)': { min: 329, max: 15078 },
    'Bitcoin': { min: 598, max: 15078 },
    'Ethereum': { min: 159, max: 15078 },
    'Tron': { min: 108, max: 15078 },
    'Toncoin': { min: 28, max: 15078 }
  },
  RON: {
    'Выплата на Binance BinPay': { min: 5, max: 122 },
    'Выплата на карту (от €5)': { min: 26, max: 122 },
    'Tether USD (Tron)': { min: 47, max: 122 },
    'Tether USD (Ethereum)': { min: 3, max: 122 },
    'Bitcoin': { min: 5, max: 122 },
    'Ethereum': { min: 2, max: 122 },
    'Tron': { min: 1, max: 122 },
    'Toncoin': { min: 1, max: 122 }
  },
  UZS: {
    'Выплата на Binance BinPay': { min: 12675, max: 354015 },
    'Выплата на банковскую карту': { min: 10000, max: 354015 },
    'Tether USD (Tron)': { min: 133166, max: 354015 },
    'Tether USD (Ethereum)': { min: 7723, max: 354015 },
    'Bitcoin': { min: 14034, max: 354015 },
    'Ethereum': { min: 3732, max: 354015 },
    'Tron': { min: 2522, max: 354015 },
    'Toncoin': { min: 649, max: 354015 }
  }
};
