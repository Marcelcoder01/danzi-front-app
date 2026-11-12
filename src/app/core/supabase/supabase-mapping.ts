/**
 * Las columnas "enum" del esquema son `text` con CHECK, así que los tipos generados las
 * exponen como `string`. Este helper las estrecha a la unión del dominio de forma segura.
 */
export function toUnion<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Los argumentos opcionales de las RPC se tipan como `T | undefined`: omitimos los nulos. */
export function optionalArg<T>(value: T | null): T | undefined {
  return value ?? undefined;
}
