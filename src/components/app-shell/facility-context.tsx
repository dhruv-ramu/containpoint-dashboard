"use client";

import { createContext, useContext } from "react";

export type FacilityScope = { id: string; name: string };

const FacilityScopeContext = createContext<FacilityScope | null>(null);

export function FacilityScopeProvider({
  value,
  children,
}: {
  value: FacilityScope;
  children: React.ReactNode;
}) {
  return (
    <FacilityScopeContext.Provider value={value}>{children}</FacilityScopeContext.Provider>
  );
}

export function useFacilityScope() {
  return useContext(FacilityScopeContext);
}
