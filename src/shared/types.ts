export type Result =
  | { success: false; errors: string[]; warnings: string[] }
  | { success: true; warnings: string[] };

export type ExtractLiterals<T> = T extends unknown ? (string extends T ? never : T) : never;
