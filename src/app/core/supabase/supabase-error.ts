export type SupabaseOperation =
  | 'read'
  | 'updateProfile'
  | 'createOrganization'
  | 'createStudent'
  | 'requestJoin'
  | 'reviewJoinRequest';

export type SupabaseErrorKind =
  | 'unauthenticated'
  | 'forbidden'
  | 'alreadyProcessed'
  | 'alreadyLinked'
  | 'manualRecordConflict'
  | 'duplicate'
  | 'notFound'
  | 'validation'
  | 'network'
  | 'unknown';

interface SupabaseLikeError {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
}

/** Error de dominio con un mensaje apto para mostrar al usuario. */
export class DanziRequestError extends Error {
  constructor(
    readonly userMessage: string,
    readonly kind: SupabaseErrorKind,
    readonly code: string | null,
  ) {
    super(userMessage);
    this.name = 'DanziRequestError';
  }
}

const RULES: ReadonlyArray<{ kind: SupabaseErrorKind; codes?: string[]; keywords?: string[] }> = [
  {
    kind: 'unauthenticated',
    codes: ['PGRST301', 'PGRST302'],
    keywords: ['not authenticated', 'no autenticado', 'jwt expired', 'auth session missing'],
  },
  {
    kind: 'alreadyProcessed',
    keywords: [
      'already processed',
      'already reviewed',
      'not pending',
      'ya procesada',
      'ya ha sido procesada',
      'ya ha sido revisada',
      'no está pendiente',
      'no esta pendiente',
    ],
  },
  {
    kind: 'manualRecordConflict',
    keywords: ['manual', 'verificación', 'verificacion', 'verification', 'verify'],
  },
  {
    kind: 'alreadyLinked',
    keywords: [
      'already a student',
      'already linked',
      'already member',
      'already belongs',
      'ya es alumno',
      'ya es miembro',
      'ya está vinculad',
      'ya esta vinculad',
      'ya pertenece',
    ],
  },
  {
    kind: 'forbidden',
    codes: ['42501'],
    keywords: [
      'permission denied',
      'not allowed',
      'not authorized',
      'unauthorized',
      'forbidden',
      'sin permisos',
      'no tienes permiso',
      'no autorizado',
      'row-level security',
    ],
  },
  {
    kind: 'duplicate',
    codes: ['23505'],
    keywords: [
      'duplicate',
      'already exists',
      'ya existe',
      'pending request',
      'solicitud pendiente',
    ],
  },
  {
    kind: 'notFound',
    codes: ['P0002'],
    keywords: ['not found', 'does not exist', 'no existe', 'no encontrad', 'inexistente'],
  },
  {
    kind: 'validation',
    codes: ['22P02', '22023', '23514', '23502', '22001'],
    keywords: ['invalid', 'inválid', 'invalid input'],
  },
  { kind: 'network', keywords: ['failed to fetch', 'network', 'load failed'] },
];

const MESSAGES: Record<SupabaseOperation, Partial<Record<SupabaseErrorKind, string>>> = {
  read: {},
  updateProfile: {
    forbidden: 'No tienes permisos para actualizar este perfil.',
    validation: 'Revisa los datos del perfil: alguno de los campos no es válido.',
  },
  createOrganization: {
    duplicate: 'Ese identificador (slug) ya está en uso. Prueba con otro.',
    validation: 'Revisa el nombre, el identificador y el tipo de academia.',
    forbidden: 'No tienes permisos para crear una academia.',
  },
  createStudent: {
    forbidden: 'No tienes permisos para dar de alta alumnos en esta academia.',
    duplicate: 'Ya existe una ficha de alumno con esos datos en la academia.',
    validation: 'Revisa los datos del alumno: alguno de los campos no es válido.',
  },
  requestJoin: {
    notFound: 'No existe ninguna academia con ese identificador.',
    duplicate: 'Ya tienes una solicitud pendiente para esta academia.',
    alreadyLinked: 'Ya eres alumno de esta academia.',
    validation: 'El identificador de la academia no es válido.',
  },
  reviewJoinRequest: {
    alreadyProcessed: 'Esta solicitud ya ha sido procesada.',
    forbidden: 'No tienes permisos para revisar solicitudes de esta academia.',
    alreadyLinked: 'Este usuario ya está vinculado a una ficha de alumno de la academia.',
    manualRecordConflict:
      'Existe una ficha manual que podría corresponder a este usuario. Requiere verificación antes de aprobar.',
    notFound: 'La solicitud ya no existe.',
  },
};

const GENERIC_MESSAGES: Record<SupabaseErrorKind, string> = {
  unauthenticated: 'Tu sesión ha caducado. Vuelve a iniciar sesión.',
  forbidden: 'No tienes permisos para realizar esta operación.',
  alreadyProcessed: 'La operación ya se había completado.',
  alreadyLinked: 'El usuario ya está vinculado.',
  manualRecordConflict: 'La operación requiere una verificación manual.',
  duplicate: 'El registro ya existe.',
  notFound: 'No se ha encontrado el recurso solicitado.',
  validation: 'Alguno de los datos no es válido.',
  network: 'No se ha podido conectar con el servidor. Comprueba tu conexión.',
  unknown: 'No se ha podido completar la operación. Inténtalo de nuevo.',
};

export function classifySupabaseError(error: SupabaseLikeError): SupabaseErrorKind {
  const text = [error.message, error.details, error.hint].filter(Boolean).join(' ').toLowerCase();
  const code = error.code ?? '';
  const rule = RULES.find(
    (candidate) =>
      candidate.codes?.includes(code) || candidate.keywords?.some((word) => text.includes(word)),
  );
  return rule?.kind ?? 'unknown';
}

export function toDanziRequestError(
  error: unknown,
  operation: SupabaseOperation,
): DanziRequestError {
  if (error instanceof DanziRequestError) return error;
  const source: SupabaseLikeError =
    error && typeof error === 'object' ? (error as SupabaseLikeError) : { message: String(error) };
  const kind = classifySupabaseError(source);
  const message = MESSAGES[operation][kind] ?? GENERIC_MESSAGES[kind];
  return new DanziRequestError(message, kind, source.code ?? null);
}

export function errorMessage(error: unknown, fallback = GENERIC_MESSAGES.unknown): string {
  return error instanceof DanziRequestError ? error.userMessage : fallback;
}
