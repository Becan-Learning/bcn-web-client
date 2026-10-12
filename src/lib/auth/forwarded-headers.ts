/* لا تعبر إلى الخادم إلا كوكي الحساب وعنوان الطالب. */
export function studentHeaders(incoming: Pick<Headers, "get">): Headers {
  const forwarded = new Headers();
  for (const name of ["cookie", "x-forwarded-for"]) {
    const value = incoming.get(name);
    if (value) forwarded.set(name, value);
  }
  return forwarded;
}
