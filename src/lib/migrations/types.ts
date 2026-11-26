export type Migration = {
  /** Sequential number; must match the file's prefix and never be reused. */
  id: number;
  name: string;
  sql: string;
};
