// Letters and digits only, lower case. So "Ganesh  Woodcraft." matches "ganesh woodcraft".
export function sameText(a: string, b: string): boolean {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean(a) === clean(b);
}