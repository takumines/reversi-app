type EMPTY = 0;
type DARK = 1;
type LIGHT = 2;

type Disc = EMPTY | DARK | LIGHT;

export type Board = Disc[][];

export type Square = number | EMPTY | DARK | LIGHT
