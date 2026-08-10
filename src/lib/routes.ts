export const ROUTES = {
  home: "/app",
  missions: "/missions",
  missionDetail: (id: string) => `/missions/${id}`,
  console: "/console",
  system: "/system",
  profile: "/profile",
} as const;
