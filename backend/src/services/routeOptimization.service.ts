export interface RouteStop {
  id: string;
  name: string;
  area: string;
  address: string;
}

export const optimizeRoute = (stops: RouteStop[]): RouteStop[] => {
  // Placeholder: return stops sorted alphabetically by area then name
  const optimized = [...stops].sort((a, b) => {
    const areaCmp = a.area.localeCompare(b.area);
    if (areaCmp !== 0) return areaCmp;
    return a.name.localeCompare(b.name);
  });

  console.log(`[ROUTE OPTIMIZATION MOCK] Optimized ${optimized.length} stops`);
  return optimized;
};
 
