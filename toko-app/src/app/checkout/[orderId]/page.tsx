import Navbar from "@/components/Navbar";
import CheckoutClient from "@/components/CheckoutClient";

export default function CheckoutPage({ params }: { params: { orderId: string } }) {
  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: "48px 0 100px", maxWidth: 560 }}>
        <CheckoutClient orderId={params.orderId} />
      </main>
    </>
  );
}
