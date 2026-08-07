export const ROUTES = {
  home: "/",
  missions: "/missions",
  missionDetail: (id: string) => `/missions/${id}`,
  system: "/system",
  profile: "/profile",
} as const;
