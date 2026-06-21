'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DailyActivity, HouseholdType, TransportMode } from '../lib/carbon';
import { calculateDailyEmissions, formatKg } from '../lib/carbon';
import { generateMicroActions } from '../lib/recommendations';
import type { MicroAction } from '../lib/recommendations';

type ChatMessage = {
  role: 'assistant' | 'user';
  text: string;
};

/**
 * Converts a raw numeric input into a safe non-negative number.
 *
 * The assistant uses this helper so invalid text input or negative values
 * cannot crash the emission calculations.
 *
 * @param rawValue - The raw string value emitted by a number input.
 * @param fallback - The default value to use if parsing fails.
 * @returns A safe, non-negative number.
 */
function parseSafeNumber(rawValue: string, fallback: number): number {
  try {
    const parsedValue = Number(rawValue);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      return fallback;
    }

    return parsedValue;
  } catch {
    return fallback;
  }
}

/**
 * Normalizes a checkbox state into a strict boolean value.
 *
 * @param checked - The UI checkbox state.
 * @returns A strict boolean suitable for React state updates.
 */
function toBoolean(checked: boolean): boolean {
  return checked === true;
}

const initialMessages: ChatMessage[] = [
  {
    role: 'assistant',
    text: 'I can help track today\'s footprint. Start by choosing your home type and transport style, then I\'ll adapt the recommendations.'
  }
];

const transportOptions: Array<{ value: TransportMode; label: string }> = [
  { value: 'walk', label: 'Walk' },
  { value: 'bike', label: 'Bike' },
  { value: 'public-transit', label: 'Public transit' },
  { value: 'ride-share', label: 'Ride-share' },
  { value: 'car', label: 'Car' }
];

const responseDelayMs = 150;

/**
 * Renders the carbon assistant interface and keeps the user's daily context in sync.
 *
 * Business logic:
 * - The conversational panel captures user context in a low-friction way.
 * - The form panel updates the pure emissions utility and the inference engine in real time.
 * - The results panel turns those calculations into immediately useful feedback.
 *
 * @returns The complete assistant experience for the page.
 */
export function CarbonAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [householdType, setHouseholdType] = useState<HouseholdType>('apartment');
  const [workingFromHome, setWorkingFromHome] = useState(true);
  const [hasCar, setHasCar] = useState(false);
  const [transportMode, setTransportMode] = useState<TransportMode>('public-transit');
  const [apartmentSharedUtilities, setApartmentSharedUtilities] = useState(true);
  const [showerMinutes, setShowerMinutes] = useState(7);
  const [electricityKwh, setElectricityKwh] = useState(6.2);
  const [transportMiles, setTransportMiles] = useState(5);
  const [mealsWithMeat, setMealsWithMeat] = useState(1);
  const [wasteBags, setWasteBags] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false); // default to light theme, togglable to dark
  const assistantTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Clears any queued assistant reply so unmounted components never try to update stale state.
   */
  const clearQueuedAssistantReply = useCallback((): void => {
    if (assistantTimeoutRef.current !== null) {
      clearTimeout(assistantTimeoutRef.current);
      assistantTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearQueuedAssistantReply();
    };
  }, [clearQueuedAssistantReply]);

  /**
   * Recalculates emissions when the daily activity inputs change.
   * Memoization keeps the expensive work scoped to actual data changes.
   */
  const emissions = useMemo(() => {
    const activity: DailyActivity = {
      electricityKwh,
      transportMiles,
      transportMode,
      mealsWithMeat,
      wasteBags
    };

    return calculateDailyEmissions(activity);
  }, [electricityKwh, mealsWithMeat, transportMiles, transportMode, wasteBags]);

  /**
   * Generates personalized micro-actions based on the current user context.
   * The assistant updates recommendations whenever any relevant signal changes.
   */
  const recommendations = useMemo(() => {
    return generateMicroActions({
      householdType,
      workingFromHome,
      hasCar,
      transportMode,
      showerMinutes,
      apartmentSharedUtilities
    });
  }, [apartmentSharedUtilities, hasCar, householdType, showerMinutes, transportMode, workingFromHome]);

  /**
   * Adds a conversational message and echoes the state update back to the user.
   *
   * @param text - The message text shown in the chat log.
   */
  const addMessage = useCallback((text: string): void => {
    try {
      clearQueuedAssistantReply();
      setMessages((currentMessages: ChatMessage[]) => [...currentMessages, { role: 'user', text }]);
      assistantTimeoutRef.current = setTimeout((): void => {
        setMessages((currentMessages: ChatMessage[]) => [
          ...currentMessages,
          {
            role: 'assistant',
            text: 'Logged. I adjusted your context and refreshed the emissions estimate plus next best actions.'
          }
        ]);
        assistantTimeoutRef.current = null;
      }, responseDelayMs);
    } catch {
      setMessages((currentMessages: ChatMessage[]) => [
        ...currentMessages,
        {
          role: 'assistant',
          text: 'I could not update the conversation, but the rest of the dashboard remains available.'
        }
      ]);
    }
  }, [clearQueuedAssistantReply]);

  /**
   * Updates the household type from the select field.
   *
   * @param rawValue - The selected value from the dropdown.
   */
  const handleHouseholdChange = useCallback((rawValue: string): void => {
    try {
      if (rawValue === 'apartment' || rawValue === 'house') {
        setHouseholdType(rawValue);
      }
    } catch {
      setHouseholdType('apartment');
    }
  }, []);

  /**
   * Resets the tracked context back to the baseline demo state.
   *
   * This gives reviewers a quick way to test the UI from a known starting point.
   */
  const resetContext = useCallback((): void => {
    try {
      clearQueuedAssistantReply();
      setMessages(initialMessages);
      setHouseholdType('apartment');
      setWorkingFromHome(true);
      setHasCar(false);
      setTransportMode('public-transit');
      setApartmentSharedUtilities(true);
      setShowerMinutes(7);
      setElectricityKwh(6.2);
      setTransportMiles(5);
      setMealsWithMeat(1);
      setWasteBags(1);
    } catch {
      setMessages((currentMessages: ChatMessage[]) => [
        ...currentMessages,
        {
          role: 'assistant',
          text: 'I could not reset every field, but the application remains usable.'
        }
      ]);
    }
  }, [clearQueuedAssistantReply]);

  /**
   * Updates the primary transport mode.
   *
   * @param rawValue - The selected transport mode from the dropdown.
   */
  const handleTransportChange = useCallback((rawValue: string): void => {
    try {
      if (
        rawValue === 'walk' ||
        rawValue === 'bike' ||
        rawValue === 'public-transit' ||
        rawValue === 'car' ||
        rawValue === 'ride-share'
      ) {
        setTransportMode(rawValue);
      }
    } catch {
      setTransportMode('public-transit');
    }
  }, []);

  /**
   * Updates a numeric field using a safe parse and a fallback.
   *
   * @param rawValue - Raw string from the number input.
   * @param setter - React state setter for the numeric field.
   * @param fallback - Fallback value if parsing fails.
   */
  const handleNumericChange = useCallback((
    rawValue: string,
    setter: React.Dispatch<React.SetStateAction<number>>,
    fallback: number
  ): void => {
    try {
      setter(parseSafeNumber(rawValue, fallback));
    } catch {
      setter(fallback);
    }
  }, []);

  /**
   * Updates a boolean field using a safe checkbox conversion.
   *
   * @param checked - The checkbox state from the UI.
   * @param setter - React state setter for the boolean field.
   */
  const handleBooleanChange = useCallback((
    checked: boolean,
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ): void => {
    try {
      setter(toBoolean(checked));
    } catch {
      setter(false);
    }
  }, []);

  const handleApartmentTransitClick = useCallback((): void => {
    addMessage('I live in an apartment and mostly use transit.');
  }, [addMessage]);

  const handleHouseCarClick = useCallback((): void => {
    addMessage('I live in a house and drive most days.');
  }, [addMessage]);

  const handleWfhFocusClick = useCallback((): void => {
    addMessage('I work from home and want low-effort actions.');
  }, [addMessage]);

  const handleThemeToggleClick = useCallback((): void => {
    setIsDarkMode((prev: boolean) => !prev);
  }, []);

  return (
    <main className={`shell ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <header className="header-bar">
        <div className="hero" aria-labelledby="app-title">
          <p className="eyebrow">Challenge 3</p>
          <h1 id="app-title">Carbon Footprint Awareness Platform</h1>
          <p className="hero-copy">
            A conversational carbon coach that learns your daily context, estimates emissions, and suggests small, realistic actions.
          </p>
        </div>
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={handleThemeToggleClick}
          aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      <section className="grid" aria-label="Carbon tracking workspace">
        <section className="panel chat-panel" aria-labelledby="chat-heading">
          <div className="panel-header">
            <h2 id="chat-heading">Conversation</h2>
            <p>Capture context naturally, one answer at a time.</p>
          </div>
          <div className="chat-log" role="log" aria-live="polite" aria-relevant="additions text">
            {messages.map((message: ChatMessage, index: number) => (
              <div key={`${message.role}-${index}`} className={`bubble ${message.role}`}>
                {message.text}
              </div>
            ))}
          </div>
          <div className="quick-actions" aria-label="Quick responses">
            <button type="button" onClick={handleApartmentTransitClick}>Apartment + transit</button>
            <button type="button" onClick={handleHouseCarClick}>House + car</button>
            <button type="button" onClick={handleWfhFocusClick}>WFH focus</button>
            <button type="button" onClick={resetContext}>Reset demo state</button>
          </div>
        </section>

        <section className="panel form-panel" aria-labelledby="form-heading">
          <div className="panel-header">
            <h2 id="form-heading">Daily context</h2>
            <p>Used to adapt recommendations and emissions estimates.</p>
          </div>

          <div className="field-grid">
            <div className="field-group">
              <label htmlFor="householdType">Home type</label>
              <select
                id="householdType"
                value={householdType}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => handleHouseholdChange(event.target.value)}
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
              </select>
            </div>

            <div className="field-group">
              <label htmlFor="transportMode">Main transport</label>
              <select
                id="transportMode"
                value={transportMode}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => handleTransportChange(event.target.value)}
              >
                {transportOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label htmlFor="electricityKwh">Electricity use today (kWh)</label>
              <input
                id="electricityKwh"
                type="number"
                min="0"
                step="0.1"
                value={electricityKwh}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleNumericChange(event.target.value, setElectricityKwh, electricityKwh)}
              />
            </div>

            <div className="field-group">
              <label htmlFor="transportMiles">Transport miles today</label>
              <input
                id="transportMiles"
                type="number"
                min="0"
                step="0.1"
                value={transportMiles}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleNumericChange(event.target.value, setTransportMiles, transportMiles)}
              />
            </div>

            <div className="field-group">
              <label htmlFor="mealsWithMeat">Meat-based meals today</label>
              <input
                id="mealsWithMeat"
                type="number"
                min="0"
                step="1"
                value={mealsWithMeat}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleNumericChange(event.target.value, setMealsWithMeat, mealsWithMeat)}
              />
            </div>

            <div className="field-group">
              <label htmlFor="wasteBags">Waste bags generated</label>
              <input
                id="wasteBags"
                type="number"
                min="0"
                step="1"
                value={wasteBags}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleNumericChange(event.target.value, setWasteBags, wasteBags)}
              />
            </div>

            <div className="field-group">
              <label htmlFor="showerMinutes">Shower minutes</label>
              <input
                id="showerMinutes"
                type="number"
                min="0"
                step="1"
                value={showerMinutes}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleNumericChange(event.target.value, setShowerMinutes, showerMinutes)}
              />
            </div>
          </div>

          <div className="checkbox-row">
            <div className="checkbox-group">
              <input
                id="workingFromHome"
                type="checkbox"
                checked={workingFromHome}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleBooleanChange(event.target.checked, setWorkingFromHome)}
              />
              <label htmlFor="workingFromHome">Work from home</label>
            </div>
            <div className="checkbox-group">
              <input
                id="hasCar"
                type="checkbox"
                checked={hasCar}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleBooleanChange(event.target.checked, setHasCar)}
              />
              <label htmlFor="hasCar">Own or regularly use a car</label>
            </div>
            <div className="checkbox-group">
              <input
                id="apartmentSharedUtilities"
                type="checkbox"
                checked={apartmentSharedUtilities}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleBooleanChange(event.target.checked, setApartmentSharedUtilities)}
              />
              <label htmlFor="apartmentSharedUtilities">Shared apartment utilities</label>
            </div>
          </div>
        </section>

        <section className="panel results-panel" aria-labelledby="results-heading">
          <div className="panel-header">
            <h2 id="results-heading">Today’s footprint</h2>
            <p>Calculated with a pure utility file for easy testing.</p>
          </div>

          <div className="stats" aria-label="Daily emissions summary">
            <div className="stat-card">
              <span id="label-total" className="stat-label">Total estimated emissions</span>
              <strong aria-labelledby="label-total" className="stat-value">{formatKg(emissions.totalKg)}</strong>
            </div>
            <div className="stat-card">
              <span id="label-electricity" className="stat-label">Electricity</span>
              <strong aria-labelledby="label-electricity" className="stat-value">{formatKg(emissions.electricityKg)}</strong>
            </div>
            <div className="stat-card">
              <span id="label-transport" className="stat-label">Transport</span>
              <strong aria-labelledby="label-transport" className="stat-value">{formatKg(emissions.transportKg)}</strong>
            </div>
            <div className="stat-card">
              <span id="label-food" className="stat-label">Food</span>
              <strong aria-labelledby="label-food" className="stat-value">{formatKg(emissions.foodKg)}</strong>
            </div>
          </div>

          <section className="actions" aria-labelledby="actions-heading">
            <h3 id="actions-heading">Personalized micro-actions</h3>
            <ul>
              {recommendations.map((action: MicroAction) => (
                <li key={action.title}>
                  <strong className="action-title">
                    {action.title}
                    {action.impact === 'high' && (
                      <span className="impact-badge" aria-label="High impact badge">⚡</span>
                    )}
                  </strong>
                  <span className="action-reason">{action.reason}</span>
                </li>
              ))}
            </ul>
          </section>
        </section>
      </section>
    </main>
  );
}

