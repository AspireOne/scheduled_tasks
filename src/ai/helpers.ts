export function augmentWithCurrentDate(prompt: string) {
  const currentTime = new Date().toLocaleDateString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${prompt}\n\n\nDnes je ${currentTime}`;
}
