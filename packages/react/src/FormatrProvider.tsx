import { createContext, useContext, type ReactNode } from 'react';

export interface FormatrContextValue {
  filters?: Record<string, (value: unknown) => unknown>;
  locale?: string;
}

const FormatrContext = createContext<FormatrContextValue>({});

export interface FormatrProviderProps {
  children: ReactNode;
  filters?: Record<string, (value: unknown) => unknown>;
  locale?: string;
}

/**
 * Provider component for formatr configuration
 * 
 * @example
 * ```tsx
 * <FormatrProvider filters={{ upper: (v) => String(v).toUpperCase() }}>
 *   <App />
 * </FormatrProvider>
 * ```
 */
export function FormatrProvider({ children, filters, locale }: FormatrProviderProps) {
  const value: FormatrContextValue = {};
  if (filters !== undefined) value.filters = filters;
  if (locale !== undefined) value.locale = locale;
  
  return (
    <FormatrContext.Provider value={value}>
      {children}
    </FormatrContext.Provider>
  );
}

export function useFormatrContext(): FormatrContextValue {
  return useContext(FormatrContext);
}
