import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * RadialMenuContext - Centralized control for the app's mobile RadialMenu
 *
 * Allows pages to set their own actions without rendering their own RadialMenu.
 * Supports both normal menu mode and action mode (single main button).
 */
const RadialMenuContext = createContext({
  actions: [],
  setActions: () => {},
  mainButton: null,
  setMainButton: () => {},
  clearMainButton: () => {}
});

export function RadialMenuProvider({ children, defaultActions = [] }) {
  const [actions, setActionsState] = useState(defaultActions);
  const [mainButton, setMainButtonState] = useState(null);

  // Stable setters
  const setActions = useCallback((newActions) => {
    setActionsState(newActions);
  }, []);

  const setMainButton = useCallback((button) => {
    setMainButtonState(button);
  }, []);

  const clearMainButton = useCallback(() => {
    setMainButtonState(null);
  }, []);

  return (
    <RadialMenuContext.Provider value={{
      actions,
      setActions,
      mainButton,
      setMainButton,
      clearMainButton
    }}>
      {children}
    </RadialMenuContext.Provider>
  );
}

/**
 * Hook to get the full context (for App.jsx to render the menu)
 */
export function useRadialMenuContext() {
  return useContext(RadialMenuContext);
}

/**
 * Hook for pages to set their RadialMenu actions
 * Actions are automatically cleared on unmount
 *
 * @param {Array} actions - Array of action objects
 * @param {Array} deps - Dependencies that should trigger action updates
 */
export function useRadialMenu(actions, deps = []) {
  const { setActions } = useContext(RadialMenuContext);

  useEffect(() => {
    setActions(actions);

    // Clear actions on unmount
    return () => {
      setActions([]);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Hook for pages to set the main button mode (e.g., save button)
 * Automatically clears on unmount
 *
 * @param {Object|null} button - { icon, label, onClick, variant } or null to clear
 * @param {Array} deps - Dependencies that should trigger button updates
 */
export function useRadialMenuMainButton(button, deps = []) {
  const { setMainButton, clearMainButton } = useContext(RadialMenuContext);

  useEffect(() => {
    if (button) {
      setMainButton(button);
    } else {
      clearMainButton();
    }

    // Clear on unmount
    return () => {
      clearMainButton();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
