/**
 * calculations.js
 * ------------------------------------------------------------------
 * All math and validation logic lives here, separate from the UI
 * components. This keeps App.jsx focused on layout/state, and makes
 * the interest formula easy to find, read, and test on its own.
 * ------------------------------------------------------------------
 */

// One rupee has 100 paise, so we round every money value to 2 decimal
// places. Plain JavaScript math (0.1 + 0.2) can produce tiny binary
// floating-point errors (0.30000000000000004), so instead of rounding
// with Math.round(x * 100) / 100 (which itself is not 100% safe for
// all inputs) we go through a fixed-point string conversion using
// toFixed, which the JS engine implements with correct decimal
// rounding for display purposes.
function roundToPaise(value) {
  // Guard against -0 which can appear after subtraction/rounding.
  const fixed = Number(value.toFixed(2));
  return fixed === 0 ? 0 : fixed;
}

// Converts whatever time period + unit the user picked into YEARS,
// because the RTCC formula (see below) expects the "Time" term in
// years. We use the standard Indian banking convention of a 365-day
// year and a 12-month year.
function convertTimeToYears(timePeriod, timeUnit) {
  switch (timeUnit) {
    case "days":
      return timePeriod / 365;
    case "months":
      return timePeriod / 12;
    case "years":
    default:
      return timePeriod;
  }
}

/**
 * RTCC FORMULA — Rate x Time x Capital, divided by the Constant 100.
 *
 *      Interest =  (Capital x Rate x Time)
 *                  ----------------------
 *                          100
 *
 * This is the standard simple-interest calculation used across
 * Indian banking, post-office schemes, and everyday lending:
 *   - Capital  (C) -> the Principal Amount the user enters, in rupees
 *   - Rate     (R) -> the annual Interest Rate, in percent
 *   - Time     (T) -> the loan/deposit duration, converted to years
 *   - Constant     -> always 100, because Rate is a percentage
 *
 * The interest is calculated once on the original principal only
 * (it is not compounded), which keeps the formula, and the numbers
 * shown to the user, simple and predictable.
 *
 * Returns an object with every value already rounded to 2 decimal
 * places (paise), ready to be formatted and displayed.
 */
export function calculateRTCCInterest({ principal, rate, timePeriod, timeUnit }) {
  const timeInYears = convertTimeToYears(timePeriod, timeUnit);

  // --- RTCC formula itself ---
  const rawInterest = (principal * rate * timeInYears) / 100;

  const interestAmount = roundToPaise(rawInterest);
  const totalAmount = roundToPaise(principal + rawInterest);

  return {
    principal: roundToPaise(principal),
    rate,
    timePeriod,
    timeUnit,
    interestAmount,
    totalAmount,
  };
}

/**
 * Formats a number as Indian Rupees using the Indian digit-grouping
 * system (2,2,3 from the right) e.g. 100000 -> ₹1,00,000.00.
 * Uses the built-in Intl API rather than a manual string-splitting
 * routine, so grouping and rounding are both handled by the browser
 * in one accurate, well-tested pass.
 */
export function formatRupees(value) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeValue);
  return `₹${formatted}`;
}

/**
 * Validates the raw (string) form input the user typed and returns:
 *   { isValid: boolean, error: string|null, value: number }
 *
 * Every field is validated independently and in plain language, so
 * the calculator never crashes on bad input and always tells the
 * person exactly what to fix.
 */
export function validatePrincipal(rawValue) {
  return validatePositiveDecimal(rawValue, {
    fieldName: "Principal amount",
    max: 999999999,
    maxMessage: "Principal amount is too large. Please enter a smaller value.",
  });
}

export function validateRate(rawValue) {
  return validatePositiveDecimal(rawValue, {
    fieldName: "Interest rate",
    allowZero: true,
    max: 100,
    maxMessage: "Interest rate cannot be more than 100%.",
  });
}

export function validateTimePeriod(rawValue, timeUnit) {
  const result = validatePositiveDecimal(rawValue, {
    fieldName: "Time period",
    max: timeUnit === "days" ? 36500 : timeUnit === "months" ? 1200 : 100,
    maxMessage: `Time period is too large for ${timeUnit}. Please enter a smaller value.`,
  });
  return result;
}

/**
 * Shared validator for "must be a positive (or zero, if allowed)
 * number, with at most 2 decimal places" style fields.
 */
function validatePositiveDecimal(
  rawValue,
  { fieldName, allowZero = false, max, maxMessage }
) {
  const trimmed = String(rawValue).trim();

  // 1) Empty field
  if (trimmed === "") {
    return { isValid: false, error: `${fieldName} is required.`, value: 0 };
  }

  // 2) Must look like a valid number (optionally with up to 2 decimals).
  //    This also catches things like "12.3.4", "abc", "1,000", "1e5".
  const validNumberPattern = /^\d+(\.\d{1,2})?$/;
  if (!validNumberPattern.test(trimmed)) {
    // Give a more specific message when the problem is decimal places.
    if (/^\d+\.\d{3,}$/.test(trimmed)) {
      return {
        isValid: false,
        error: `${fieldName} can have at most 2 decimal places.`,
        value: 0,
      };
    }
    return {
      isValid: false,
      error: `${fieldName} must be a valid number (e.g. 1000 or 1000.50).`,
      value: 0,
    };
  }

  const numericValue = Number(trimmed);

  // 3) Negative values (defensive check; the pattern above already
  //    blocks a leading "-", but we keep this for clarity/safety).
  if (numericValue < 0) {
    return { isValid: false, error: `${fieldName} cannot be negative.`, value: 0 };
  }

  // 4) Zero handling
  if (numericValue === 0 && !allowZero) {
    return { isValid: false, error: `${fieldName} must be greater than zero.`, value: 0 };
  }

  // 5) Unreasonably large values
  if (max !== undefined && numericValue > max) {
    return { isValid: false, error: maxMessage, value: 0 };
  }

  return { isValid: true, error: null, value: numericValue };
}
