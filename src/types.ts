export enum EstadoProducto {
  ACTIVO = 'activo',
  NO_ACTIVO = 'no-activo',
}

export enum EstadoMaterial {
  ACTIVO = 'activo',
  NO_ACTIVO = 'no-activo',
}

export enum TipoMovimiento {
  VENTA = 'venta',
  COMPRA = 'compra',
  CONSUMO = 'consumo',
  PRODUCCION = 'produccion',
  TRANSFERENCIA = 'transferencia',
}

export enum TipoArticulo {
  PRODUCTO = 'producto',
  MATERIAL = 'material',
}

export enum EstadoMovimiento {
  ACTIVO = 'activo',
  ELIMINADO = 'eliminado',
}

export type TipoProducto = 'A' | 'B' | 'C' | null;
