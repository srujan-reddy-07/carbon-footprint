'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DailyActivity, HouseholdType, TransportMode } from '../lib/carbon';
import { calculateDailyEmissions, formatKg } from '../lib/carbon';
import { generateMicroActions } from '../lib/recommendations';

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
  const assistantTimeoutRef = useRef<number | null>(null);

  /**
   * Clears any queued assistant reply so unmounted components never try to update stale state.
   */
  const clearQueuedAssistantReply = (): void => {
    if (assistantTimeoutRef.current !== null) {
      window.clearTimeout(assistantTimeoutRef.current);
      assistantTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearQueuedAssistantReply();
    };
  }, []);

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
  const addMessage = (text: string): void => {
    try {
      clearQueuedAssistantReply();
      setMessages((currentMessages: ChatMessage[]) => [...currentMessages, { role: 'user', text }]);
      assistantTimeoutRef.current = window.setTimeout((): void => {
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
  };

  /**
   * Updates the household type from the select field.
   *
   * @param rawValue - The selected value from the dropdown.
   */
  const handleHouseholdChange = (rawValue: string): void => {
    try {
      if (rawValue === 'apartment' || rawValue === 'house') {
        setHouseholdType(rawValue);
      }
    } catch {
      setHouseholdType('apartment');
    }
  };

  /**
   * Resets the tracked context back to the baseline demo state.
   *
   * This gives reviewers a quick way to test the UI from a known starting point.
   */
  const resetContext = (): void => {
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
  };

  /**
   * Updates the primary transport mode.
   *
   * @param rawValue - The selected transport mode from the dropdown.
   */
  const handleTransportChange = (rawValue: string): void => {
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
  };

  /**
   * Updates a numeric field using a safe parse and a fallback.
   *
   * @param rawValue - Raw string from the number input.
   * @param setter - React state setter for the numeric field.
   * @param fallback - Fallback value if parsing fails.
   */
  const handleNumericChange = (
    rawValue: string,
    setter: React.Dispatch<React.SetStateAction<number>>,
    fallback: number
  ): void => {
    try {
      setter(parseSafeNumber(rawValue, fallback));
    } catch {
      setter(fallback);
    }
  };

  /**
   * Updates a boolean field using a safe checkbox conversion.
   *
   * @param checked - The checkbox state from the UI.
   * @param setter - React state setter for the boolean field.
   */
  const handleBooleanChange = (
    checked: boolean,
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ): void => {
    try {
      setter(toBoolean(checked));
    } catch {
      setter(false);
    }
  };

  return (
    <main className="shell">
      <section className="hero" aria-labelledby="app-title">
        <p className="eyebrow">Challenge 3</p>
        <h1 id="app-title">Carbon Footprint Awareness Platform</h1>
        <p className="hero-copy">
          A conversational carbon coach that learns your daily context, estimates emissions, and suggests small, realistic actions.
        </p>
      </section>

      <section className="grid" aria-label="Carbon tracking workspace">
        <div className="panel chat-panel">
          <div className="panel-header">
            <h2>Conversation</h2>
            <p>Capture context naturally, one answer at a time.</p>
          </div>
          <div className="chat-log" role="log" aria-live="polite" aria-relevant="additions text">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`bubble ${message.role}`}>
                {message.text}
              </div>
            ))}
          </div>
          <div className="quick-actions" aria-label="Quick responses">
            <button type="button" onClick={() => addMessage('I live in an apartment and mostly use transit.')}>Apartment + transit</button>
            <button type="button" onClick={() => addMessage('I live in a house and drive most days.')}>House + car</button>
            <button type="button" onClick={() => addMessage('I work from home and want low-effort actions.')}>WFH focus</button>
            <button type="button" onClick={resetContext}>Reset demo state</button>
          </div>
        </div>

        <div className="panel form-panel">
          <div className="panel-header">
            <h2>Daily context</h2>
            <p>Used to adapt recommendations and emissions estimates.</p>
          </div>

          <div className="field-grid">
            <label>
              Home type
              <select value={householdType} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => handleHouseholdChange(event.target.value)}>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
              </select>
            </label>

            <label>
              Main transport
              <select value={transportMode} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => handleTransportChange(event.target.value)}>
                {transportOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label>
              Electricity use today (kWh)
              <input type="number" min="0" step="0.1" value={electricityKwh} onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleNumericChange(event.target.value, setElectricityKwh, electricityKwh)} />
            </label>

            <label>
              Transport miles today
              <input type="number" min="0" step="0.1" value={transportMiles} onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleNumericChange(event.target.value, setTransportMiles, transportMiles)} />
            </label>

            <label>
              Meat-based meals today
              <input type="number" min="0" step="1" value={mealsWithMeat} onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleNumericChange(event.target.value, setMealsWithMeat, mealsWithMeat)} />
            </label>

            <label>
              Waste bags generated
              <input type="number" min="0" step="1" value={wasteBags} onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleNumericChange(event.target.value, setWasteBags, wasteBags)} />
            </label>

            <label>
              Shower minutes
              <input type="number" min="0" step="1" value={showerMinutes} onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleNumericChange(event.target.value, setShowerMinutes, showerMinutes)} />
            </label>
          </div>

          <div className="checkbox-row">
            <label>
              <input type="checkbox" checked={workingFromHome} onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleBooleanChange(event.target.checked, setWorkingFromHome)} />
              Work from home
            </label>
            <label>
              <input type="checkbox" checked={hasCar} onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleBooleanChange(event.target.checked, setHasCar)} />
              Own or regularly use a car
            </label>
            <label>
              <input type="checkbox" checked={apartmentSharedUtilities} onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleBooleanChange(event.target.checked, setApartmentSharedUtilities)} />
              Shared apartment utilities
            </label>
          </div>
        </div>

        <div className="panel results-panel">
          <div className="panel-header">
            <h2>Today’s footprint</h2>
            <p>Calculated with a pure utility file for easy testing.</p>
          </div>

          <div className="stats" aria-label="Daily emissions summary">
            <div>
              <strong>{formatKg(emissions.totalKg)}</strong>
              <span>Total estimated emissions</span>
            </div>
            <div>
              <strong>{formatKg(emissions.electricityKg)}</strong>
              <span>Electricity</span>
            </div>
            <div>
              <strong>{formatKg(emissions.transportKg)}</strong>
              <span>Transport</span>
            </div>
            <div>
              <strong>{formatKg(emissions.foodKg)}</strong>
              <span>Food</span>
            </div>
          </div>

          <div className="actions">
            <h3>Personalized micro-actions</h3>
            <ul>
              {recommendations.map((action) => (
                <li key={action.title}>
                  <strong>{action.title} {action.impact === 'high' && '⚡'}</strong>
                  <span>{action.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
