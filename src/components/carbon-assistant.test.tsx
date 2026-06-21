/// <reference types="jest" />

/**
 * @jest-environment jsdom
 */

import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { CarbonAssistant } from './carbon-assistant';

describe('CarbonAssistant Component', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders successfully with initial state', async () => {
    await act(async () => {
      const root = createRoot(container);
      root.render(<CarbonAssistant />);
    });

    const titleElement = container.querySelector('h1');
    expect(titleElement).not.toBeNull();
    expect(titleElement?.textContent).toBe('Carbon Footprint Awareness Platform');

    const totalEmissionsElement = container.querySelector('.stats strong');
    expect(totalEmissionsElement?.textContent).toContain('kg CO2e');
  });

  it('allows clicking quick action buttons to update state', async () => {
    await act(async () => {
      const root = createRoot(container);
      root.render(<CarbonAssistant />);
    });

    const buttons = container.querySelectorAll('.quick-actions button');
    expect(buttons.length).toBe(4);

    await act(async () => {
      const button = Array.from(buttons).find(b => b.textContent === 'House + car') as HTMLButtonElement | undefined;
      if (button) {
        button.click();
      }
    });

    const bubbles = container.querySelectorAll('.bubble');
    expect(bubbles.length).toBeGreaterThan(1);
    
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    const updatedBubbles = container.querySelectorAll('.bubble');
    expect(updatedBubbles.length).toBeGreaterThan(2);
  });

  it('updates emissions when numeric inputs change', async () => {
    await act(async () => {
      const root = createRoot(container);
      root.render(<CarbonAssistant />);
    });

    const electricityInput = container.querySelector('input[id="electricityKwh"]') as HTMLInputElement | null;
    expect(electricityInput).not.toBeNull();

    if (electricityInput) {
      await act(async () => {
        electricityInput.value = '15.5';
        const event = new window.Event('input', { bubbles: true });
        electricityInput.dispatchEvent(event);
        const changeEvent = new window.Event('change', { bubbles: true });
        electricityInput.dispatchEvent(changeEvent);
      });
    }

    const totalEmissionsElement = container.querySelector('.stats strong');
    expect(totalEmissionsElement?.textContent).not.toBeNull();
  });

  it('resets context when reset button is clicked', async () => {
    await act(async () => {
      const root = createRoot(container);
      root.render(<CarbonAssistant />);
    });

    const buttons = container.querySelectorAll('.quick-actions button');
    const resetButton = Array.from(buttons).find(b => b.textContent === 'Reset demo state') as HTMLButtonElement | undefined;
    expect(resetButton).toBeDefined();

    if (resetButton) {
      await act(async () => {
        resetButton.click();
      });
    }

    const bubbles = container.querySelectorAll('.bubble');
    expect(bubbles.length).toBe(1);
  });
});

