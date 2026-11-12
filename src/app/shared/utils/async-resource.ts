import { Signal, computed, effect, signal, untracked } from '@angular/core';

export interface AsyncResourceOptions<P, T> {
  /** Parámetros reactivos. Si devuelve `undefined`, no se carga y el valor vuelve a `defaultValue`. */
  params: () => P | undefined;
  loader: (context: { params: P }) => Promise<T>;
  defaultValue: T;
}

export interface AsyncResourceRef<T> {
  readonly value: Signal<T>;
  readonly isLoading: Signal<boolean>;
  readonly error: Signal<unknown>;
  readonly hasError: Signal<boolean>;
  reload(): void;
}

/**
 * Carga asíncrona reactiva a partir de signals: recarga al cambiar `params`, descarta
 * respuestas obsoletas y expone valor, carga y error como signals.
 *
 * Mismo contrato (`params`, `loader`, `defaultValue`, `value`, `isLoading`, `error`, `reload`)
 * que `resource()` de Angular, que en la v21 sigue siendo experimental. Cuando sea estable,
 * se puede sustituir sin cambiar los componentes.
 *
 * Debe crearse en un contexto de inyección (inicializador de campo o constructor).
 */
export function asyncResource<P, T>(options: AsyncResourceOptions<P, T>): AsyncResourceRef<T> {
  const value = signal<T>(options.defaultValue);
  const isLoading = signal(false);
  const error = signal<unknown>(undefined);
  const reloadCounter = signal(0);
  let requestId = 0;
  let lastParams: P | undefined;

  effect(() => {
    reloadCounter();
    const params = options.params();
    untracked(() => run(params));
  });

  async function run(params: P | undefined): Promise<void> {
    const current = ++requestId;
    error.set(undefined);
    // Al cambiar de parámetros (p. ej. de academia) no se muestran datos del contexto anterior.
    if (!Object.is(params, lastParams)) value.set(options.defaultValue);
    lastParams = params;
    if (params === undefined) {
      isLoading.set(false);
      return;
    }
    isLoading.set(true);
    try {
      const result = await options.loader({ params });
      if (current === requestId) value.set(result);
    } catch (cause) {
      if (current === requestId) error.set(cause);
    } finally {
      if (current === requestId) isLoading.set(false);
    }
  }

  return {
    value: value.asReadonly(),
    isLoading: isLoading.asReadonly(),
    error: error.asReadonly(),
    hasError: computed(() => error() !== undefined),
    reload: () => reloadCounter.update((count) => count + 1),
  };
}
