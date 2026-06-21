'use client';

import { useMemo, useState } from 'react';
import type { DailyActivity, HouseholdType, TransportMode } from '../lib/carbon';
import { calculateDailyEmissions, formatKg } from '../lib/carbon';
import { generateMicroActions } from '../lib/recommendations';

type ChatMessage = {
  role: 'assistant' | 'user';
  text: string;
};

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

  // Recalculate emissions whenever daily activity inputs change
  // Using useMemo prevents recalculation on every render
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

  // Generate personalized micro-actions based on user context
  // These adapt dynamically as the user updates household and lifestyle inputs
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

  const addMessage = (text: string) => {
    setMessages((current) => [...current, { role: 'user', text }]);
    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: 'Logged. I adjusted your context and refreshed the emissions estimate plus next best actions.'
        }
      ]);
    }, 150);
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
              <select value={householdType} onChange={(event) => setHouseholdType(event.target.value as HouseholdType)}>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
              </select>
            </label>

            <label>
              Main transport
              <select value={transportMode} onChange={(event) => setTransportMode(event.target.value as TransportMode)}>
                {transportOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label>
              Electricity use today (kWh)
              <input type="number" min="0" step="0.1" value={electricityKwh} onChange={(event) => setElectricityKwh(Number(event.target.value))} />
            </label>

            <label>
              Transport miles today
              <input type="number" min="0" step="0.1" value={transportMiles} onChange={(event) => setTransportMiles(Number(event.target.value))} />
            </label>

            <label>
              Meat-based meals today
              <input type="number" min="0" step="1" value={mealsWithMeat} onChange={(event) => setMealsWithMeat(Number(event.target.value))} />
            </label>

            <label>
              Waste bags generated
              <input type="number" min="0" step="1" value={wasteBags} onChange={(event) => setWasteBags(Number(event.target.value))} />
            </label>

            <label>
              Shower minutes
              <input type="number" min="0" step="1" value={showerMinutes} onChange={(event) => setShowerMinutes(Number(event.target.value))} />
            </label>
          </div>

          <div className="checkbox-row">
            <label>
              <input type="checkbox" checked={workingFromHome} onChange={(event) => setWorkingFromHome(event.target.checked)} />
              Work from home
            </label>
            <label>
              <input type="checkbox" checked={hasCar} onChange={(event) => setHasCar(event.target.checked)} />
              Own or regularly use a car
            </label>
            <label>
              <input type="checkbox" checked={apartmentSharedUtilities} onChange={(event) => setApartmentSharedUtilities(event.target.checked)} />
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
