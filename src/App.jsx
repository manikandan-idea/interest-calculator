import React, { useMemo, useState } from "react";
import {
  calculateRTCCInterest,
  formatRupees,
  validatePrincipal,
  validateRate,
  validateTimePeriod,
} from "./calculations.js";

// The interest rate slider's range and step. 0.1% steps let the
// slider land on realistic bank/loan rates (e.g. 6.5%, 8.25% needs
// the number field, but the slider covers the common range fast).
const RATE_MIN = 0;
const RATE_MAX = 30;
const RATE_STEP = 0.1;

const TIME_UNITS = [
  { value: "days", label: "Days" },
  { value: "months", label: "Months" },
  { value: "years", label: "Years" },
];

export default function App() {
  // --- Raw input state (kept as strings so the user can freely type,
  //     including a trailing "." while entering a decimal) ---
  const [principalInput, setPrincipalInput] = useState("10000");
  const [rateInput, setRateInput] = useState("8");
  const [timePeriodInput, setTimePeriodInput] = useState("1");
  const [timeUnit, setTimeUnit] = useState("years");

  // --- Validate every field independently, every render. This is
  //     cheap (plain string/number checks) and means results always
  //     reflect the latest input with no extra "submit" step. ---
  const principalCheck = useMemo(
    () => validatePrincipal(principalInput),
    [principalInput]
  );
  const rateCheck = useMemo(() => validateRate(rateInput), [rateInput]);
  const timeCheck = useMemo(
    () => validateTimePeriod(timePeriodInput, timeUnit),
    [timePeriodInput, timeUnit]
  );

  const allValid = principalCheck.isValid && rateCheck.isValid && timeCheck.isValid;

  // --- Only run the RTCC calculation once every input is valid ---
  const results = useMemo(() => {
    if (!allValid) return null;
    return calculateRTCCInterest({
      principal: principalCheck.value,
      rate: rateCheck.value,
      timePeriod: timeCheck.value,
      timeUnit,
    });
  }, [allValid, principalCheck.value, rateCheck.value, timeCheck.value, timeUnit]);

  // The slider always shows the current numeric rate. If the text
  // field currently holds something invalid, fall back to the last
  // good value (or 0) so the slider thumb never jumps around.
  const sliderValue = rateCheck.isValid
    ? Math.min(Math.max(rateCheck.value, RATE_MIN), RATE_MAX)
    : 0;

  function handleSliderChange(event) {
    setRateInput(event.target.value);
  }

  function handleReset() {
    setPrincipalInput("10000");
    setRateInput("8");
    setTimePeriodInput("1");
    setTimeUnit("years");
  }

  return (
    <div className="page">
      <header className="app-header">
        <div className="app-header__mark" aria-hidden="true">
          ₹
        </div>
        <div>
          <h1 className="app-header__title">Interest Calculator</h1>
          <p className="app-header__subtitle">
            Simple interest, calculated instantly &middot; RTCC method
          </p>
        </div>
      </header>

      <main className="layout">
        {/* ---------------- INPUT SECTION ---------------- */}
        <section className="card inputs-card" aria-label="Interest calculator inputs">
          <NumberField
            id="principal"
            label="Principal Amount"
            prefix="₹"
            value={principalInput}
            onChange={setPrincipalInput}
            placeholder="e.g. 10000.00"
            error={principalCheck.error}
            inputMode="decimal"
          />

          <div className="field">
            <div className="field__label-row">
              <label htmlFor="rate-number" className="field__label">
                Interest Rate
              </label>
              <span className={"field__badge" + (rateCheck.isValid ? "" : " field__badge--error")}>
                {rateCheck.isValid ? `${rateCheck.value}%` : "—"}
              </span>
            </div>

            <input
              className="slider"
              type="range"
              id="rate-slider"
              min={RATE_MIN}
              max={RATE_MAX}
              step={RATE_STEP}
              value={sliderValue}
              onChange={handleSliderChange}
              aria-label="Interest rate slider, in percent"
              aria-valuetext={`${sliderValue} percent`}
            />
            <div className="slider__scale" aria-hidden="true">
              <span>{RATE_MIN}%</span>
              <span>{RATE_MAX}%</span>
            </div>

            <div className="field__input-with-suffix">
              <input
                id="rate-number"
                className="text-input"
                type="text"
                inputMode="decimal"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                placeholder="e.g. 8.5"
                aria-describedby="rate-error"
              />
              <span className="field__suffix">%</span>
            </div>
            <ValidationMessage id="rate-error" message={rateCheck.error} />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="time-period">
              Time Period
            </label>
            <div className="time-row">
              <input
                id="time-period"
                className="text-input"
                type="text"
                inputMode="decimal"
                value={timePeriodInput}
                onChange={(e) => setTimePeriodInput(e.target.value)}
                placeholder="e.g. 12"
                aria-describedby="time-error"
              />
              <div className="unit-toggle" role="group" aria-label="Time unit">
                {TIME_UNITS.map((unit) => (
                  <button
                    key={unit.value}
                    type="button"
                    className={
                      "unit-toggle__btn" +
                      (timeUnit === unit.value ? " unit-toggle__btn--active" : "")
                    }
                    aria-pressed={timeUnit === unit.value}
                    onClick={() => setTimeUnit(unit.value)}
                  >
                    {unit.label}
                  </button>
                ))}
              </div>
            </div>
            <ValidationMessage id="time-error" message={timeCheck.error} />
          </div>

          <button type="button" className="reset-btn" onClick={handleReset}>
            Reset to defaults
          </button>
        </section>

        {/* ---------------- RESULTS SECTION ---------------- */}
        <section className="card results-card" aria-label="Calculation results" aria-live="polite">
          <h2 className="results-card__title">Your results</h2>

          {!allValid && (
            <p className="results-card__empty">
              Fill in every field correctly to see your interest amount here.
            </p>
          )}

          {allValid && results && (
            <div className="passbook">
              <PassbookRow label="Principal Amount" value={formatRupees(results.principal)} />
              <PassbookRow label="Interest Rate" value={`${results.rate}% per year`} />
              <PassbookRow
                label="Time Period"
                value={`${results.timePeriod} ${
                  results.timePeriod === 1 ? results.timeUnit.slice(0, -1) : results.timeUnit
                }`}
              />
              <PassbookRow label="Interest Amount" value={formatRupees(results.interestAmount)} />
              <div className="passbook__divider" aria-hidden="true" />
              <PassbookRow label="Total Amount" value={formatRupees(results.totalAmount)} emphasize />
            </div>
          )}
        </section>
      </main>

      <footer className="app-footer">
        Works completely offline &middot; RTCC = (Capital &times; Rate &times; Time) &divide; 100
      </footer>
    </div>
  );
}

/** A labelled text input with a currency prefix and inline validation message. */
function NumberField({ id, label, prefix, value, onChange, placeholder, error, inputMode }) {
  const errorId = `${id}-error`;
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="field__input-with-prefix">
        {prefix && <span className="field__prefix">{prefix}</span>}
        <input
          id={id}
          className="text-input text-input--with-prefix"
          type="text"
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-describedby={errorId}
          aria-invalid={Boolean(error)}
        />
      </div>
      <ValidationMessage id={errorId} message={error} />
    </div>
  );
}

/** Small, consistent error-message renderer. Renders nothing when there is no error. */
function ValidationMessage({ id, message }) {
  if (!message) return null;
  return (
    <p className="validation-message" id={id} role="alert">
      {message}
    </p>
  );
}

/** One line item in the "passbook" style results card. */
function PassbookRow({ label, value, emphasize }) {
  return (
    <div className={"passbook__row" + (emphasize ? " passbook__row--total" : "")}>
      <span className="passbook__label">{label}</span>
      <span className="passbook__dots" aria-hidden="true" />
      <span className="passbook__value">{value}</span>
    </div>
  );
}
