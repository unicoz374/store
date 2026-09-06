// Kontrak yang harus dipenuhi setiap adapter payment gateway.
// Dengan pola ini, menambah gateway baru = bikin 1 file baru yang implement interface ini,
// tanpa mengubah kode order/webhook yang sudah ada.
export interface CreatePaymentParams {
  orderId: string;
  amount: number;
  produkNama: string;
  customerName?: string;
}

export interface CreatePaymentResult {
  paymentUrl?: string | null;
  qrString?: string | null;
  vaNumber?: string | null;
  paymentRef: string; // id/reference dari sisi gateway, disimpan utk pencocokan webhook
  raw?: unknown;
}

export interface GatewayAdapter {
  name: string;
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  /** Verifikasi keaslian request webhook (signature/token) sebelum dipercaya */
  verifyWebhookSignature(payload: any, headers: Headers): boolean;
  /** Ambil status pembayaran dari payload webhook: 'paid' | 'pending' | 'failed' */
  parseWebhookStatus(payload: any): { orderId: string; status: "paid" | "pending" | "failed"; ref: string };
}
