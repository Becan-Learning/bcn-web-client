let pending: Promise<void> = Promise.resolve();

/* ردّ الحفظ يعيد ضبط الكوكي؛ الخروج ينتظر الردّ حتى لا يعود الحساب مسجّلًا. */
export function runSettingsAuthMutation<T>(mutation: () => Promise<T>): Promise<T> {
  const result = pending.then(mutation);
  pending = result.then(() => undefined, () => undefined);
  return result;
}
