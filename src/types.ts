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

export enum EstadoCaja {
  ABIERTA = 'abierta',
  CERRADA = 'cerrada',
}

export enum TipoPago {
  TARJETA_CREDITO = 'tarjeta-credito',
  TARJETA_DEBITO = 'tarjeta-debito',
  EFECTIVO = 'efectivo',
  TRANSFERENCIA_QR = 'transferencia-qr',
  CUENTA_CORRIENTE = 'cuenta-corriente',
}

export const ETIQUETAS_TIPO_PAGO: Record<TipoPago, string> = {
  [TipoPago.TARJETA_CREDITO]: 'Tarjeta crédito',
  [TipoPago.TARJETA_DEBITO]: 'Tarjeta débito',
  [TipoPago.EFECTIVO]: 'Efectivo',
  [TipoPago.TRANSFERENCIA_QR]: 'Transferencia / QR',
  [TipoPago.CUENTA_CORRIENTE]: 'Cuenta corriente',
}

export interface Proveedor {
  id: number
  nombre: string
  telefono?: string | null
  email?: string | null
  notas?: string | null
}

export interface Notificacion {
  id: number
  tipo: string
  titulo: string
  mensaje?: string | null
  idCajaPuesto?: number | null
  leida: boolean
  createdAt: string
}

export interface AlmacenResumen {
  id: number
  nombre: string
  ubicacion?: string
}

export interface CajaPuesto {
  id: number
  idUsuario: string
  nombreUsuario?: string
  idAlmacen: number
  almacen?: AlmacenResumen
  fechaApertura: string
  fechaCierre?: string | null
  estado: EstadoCaja
  totalVendido: number
  montoDeclarado?: number | null
  montoTransferido?: number | null
  faltante?: number | null
  sobrante?: number | null
  observaciones?: string | null
  totalesPorPago?: Record<string, number> | null
}

export interface VentaCaja {
  id: number
  fecha: string
  cantidad: number
  precio: number
  total: number
  idProducto: number
  tipoPago?: TipoPago | null
  producto?: { id: number; nombre: string; codigo?: string; presentacion?: string }
}

export interface ProductoPuesto {
  id: number
  nombre: string
  codigo?: string
  presentacion?: string
  talle?: string | null
  color?: string | null
  precio: number
  precioConIva?: boolean
  alicuotaIva?: number
  stockPuesto: number
  stockGeneral: number
}

export interface MovimientoCajaCentral {
  id: number
  fecha: string
  tipo: string
  monto: number
  idCajaPuesto?: number | null
  nombreUsuario?: string
  descripcion?: string | null
}

export interface Cliente {
  id: number
  nombre: string
  cuit?: string | null
  condicionIva?: string | null
  domicilio?: string | null
  telefono?: string | null
  email?: string | null
}

export interface PuntoVenta {
  id: number
  numero: number
  descripcion?: string | null
  predeterminado: boolean
}

export type EstadoComprobante = 'pendiente' | 'aprobado' | 'rechazado'

export interface Comprobante {
  id: number
  idVenta: number
  tipoComprobante: number
  puntoVenta: number
  nroComprobante: number
  cae?: string | null
  caeVencimiento?: string | null
  estado: EstadoComprobante
  codigoBarras?: string | null
  mensajeError?: string | null
  createdAt: string
  snapshot?: {
    detalle?: {
      netoGravado: number
      impIVA: number
      impTotal: number
    }
  } | null
}

export interface VentaListado {
  id: number
  fecha: string
  total: number
  tipoPago?: string | null
  cliente?: Cliente | null
  comprobante?: Comprobante | null
}

export interface CredencialArcaInfo {
  id: number
  entorno: 'homologacion' | 'produccion'
  vencimiento?: string | null
  activo: boolean
  updatedAt: string
}

export const CONDICIONES_IVA_CLIENTE = [
  'IVA Responsable Inscripto',
  'IVA Responsable No Inscripto',
  'IVA Sujeto Exento',
  'Consumidor Final',
  'Responsable Monotributo',
  'Monotributo Social',
  'IVA No Alcanzado',
]

export interface ItemSimulado {
  codigo: string
  descripcion: string
  cantidad: number
  precioUnitarioNeto: number
  alicuotaIva: number
  subtotalNeto: number
  subtotalConIva: number
}

export interface SimulacionFactura {
  venta: { id: number; fecha: string; tipoPago?: string | null }
  empresa: { razonSocial: string; cuit: string }
  tipoComprobante: number
  letra: string
  puntoVenta: number
  receptor: { nombre: string; cuit: string; docTipo: number; docNro: number; condicionIva: string }
  items: ItemSimulado[]
  netoGravado: number
  impIVA: number
  impTotal: number
  ivaPorAlicuota: { id: number; alicuota: number; baseImp: number; importe: number }[]
}
