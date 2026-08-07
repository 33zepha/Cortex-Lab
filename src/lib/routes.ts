export const ROUTES = {
  home: "/",
  missions: "/missions",
  missionDetail: (id: string) => `/missions/${id}`,
  console: "/console",
  system: "/system",
  profile: "/profile",
} as const;
