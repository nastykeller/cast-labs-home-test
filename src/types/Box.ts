export interface Box {
  size: number;
  type: string;
  offset: number;
  children?: Box[];
  content?: string;
}
