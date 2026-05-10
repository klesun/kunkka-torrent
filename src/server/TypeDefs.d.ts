export type Primitive = number | string | boolean | null;
export type SerialData = Primitive | { [k: string]: SerialData } | { [k: number]: SerialData } | SerialData[];
