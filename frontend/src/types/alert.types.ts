export type AlertType = 'success' | 'error';

export interface Alert {
  type: AlertType;
  message: string;
}
