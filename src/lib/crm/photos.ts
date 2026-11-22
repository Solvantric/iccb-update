/** Sample profile photos for the demo team (free Unsplash photos, cropped to the face). */
const unsplashFace = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=facearea&facepad=2.2&w=160&h=160&q=80`;

export const TEAM_PHOTOS: Record<string, string> = {
  "u-admin": unsplashFace("1472099645785-5658abf4ff4e"), // Admin
  "u-sales": unsplashFace("1706943262459-3ef6ce03305c"), // Nusrat Jahan
  "u-sales2": unsplashFace("1683105653852-25028a53a3e4"), // Rafiq Hasan
  "u-sales3": unsplashFace("1536766768598-e09213fdcf22"), // Tania Akter
};
