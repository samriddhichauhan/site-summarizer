export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  cached?: boolean;
  error?: string;
}
