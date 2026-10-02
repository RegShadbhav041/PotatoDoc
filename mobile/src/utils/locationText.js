// Template interpolation for backend-generated English strings.
// The API returns templates with {placeholders} (so i18n can translate the
// sentence first); the screen calls t(template) then fmt(result, vars).
export function fmt(template, vars) {
  if (typeof template !== "string") return "";
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) && vars[key] != null
      ? String(vars[key])
      : match
  );
}
