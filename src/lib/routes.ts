export const ROUTES = {
  home: "/",
  missions: "/missions",
  missionDetail: (id: string) => `/missions/${id}`,
  system: "/system",
} as const;
