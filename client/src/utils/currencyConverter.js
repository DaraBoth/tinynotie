/**
 * Currency Converter Utility
 * Uses ExchangeRate-API to convert between currencies
 */

// Free API key for ExchangeRate-API (limited to 1500 requests per month)
// In a production environment, this should be stored in an environment variable
const API_KEY = "a763ca6fffda3501fb612dc5";

/**
 * Get the latest exchange rates for a base currency
 * @param {string} baseCurrency - The base currency code (e.g., "USD")
 * @returns {Promise} - Promise that resolves to exchange rate data
 */
export const getExchangeRates = async (baseCurrency) => {
  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${baseCurrency}`
    );
    const data = await response.json();

    if (data.result === "error") {
      throw new Error(data["error-type"]);
    }

    return data;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    throw error;
  }
};

/**
 * Convert an amount from one currency to another
 * @param {number} amount - The amount to convert
 * @param {string} fromCurrency - The source currency code (e.g., "AUD")
 * @param {string} toCurrency - The target currency code (e.g., "KRW")
 * @returns {Promise} - Promise that resolves to the converted amount
 */
export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${fromCurrency}/${toCurrency}/${amount}`
    );
    const data = await response.json();

    if (data.result === "error") {
      throw new Error(data["error-type"]);
    }

    return {
      amount: data.conversion_result,
      rate: data.conversion_rate,
      fromCurrency,
      toCurrency
    };
  } catch (error) {
    console.error("Error converting currency:", error);
    throw error;
  }
};

/**
 * Get currency symbol from currency code
 * @param {string} currencyCode - The currency code (e.g., "USD", "AUD", "KRW")
 * @returns {string} - The currency symbol
 */
export const getCurrencySymbol = (currencyCode) => {
  const symbols = {
    USD: "$",
    AUD: "AUD",
    KRW: "₩",
    ZAR: "R",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CNY: "¥",
    INR: "₹",
    // Add more currency symbols as needed
  };

  return symbols[currencyCode] || currencyCode;
};

/**
 * Get currency name from currency code
 * @param {string} currencyCode - The currency code (e.g., "USD")
 * @returns {string} - The currency name
 */
export const getCurrencyName = (currencyCode) => {
  const names = {
    USD: "US Dollar",
    AUD: "Australian Dollar",
    KRW: "Korean Won",
    ZAR: "South African Rand",
    EUR: "Euro",
    GBP: "British Pound",
    JPY: "Japanese Yen",
    CNY: "Chinese Yuan",
    INR: "Indian Rupee",
    // Add more currency names as needed
  };

  return names[currencyCode] || currencyCode;
};

/**
 * Get common currencies for quick selection
 * @returns {Array} - Array of common currency codes
 */
export const getCommonCurrencies = () => {
  return [
    "USD",
    "AUD",
    "KRW",
    "ZAR",
    "EUR",
    "GBP",
    "JPY",
    "CNY",
    "INR"
  ];
};
