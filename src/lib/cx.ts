/** Joins class names, discarding falsy entries. */
export function cx(
  ...values: (string | false | null | undefined)[]
): string {
  return values.filter(Boolean).join(' ')
}
