"use client";

import { FormEvent, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Container, Form, InputGroup, Row, Spinner } from "react-bootstrap";

type PaymentResult = {
  code?: string | number;
  message?: string;
  transactionId?: string;
  paymentUrl?: string;
};

export default function Home() {
  const [amount, setAmount] = useState("100");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentResult | null>(null);

  const amountValue = useMemo(() => Number(amount), [amount]);
  const amountIsValid = Number.isFinite(amountValue) && amountValue > 0;

  const submitPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!amountIsValid) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/payments/comgate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amountCzk: amountValue }),
      });
      const payload: PaymentResult = await response.json();
      if (!response.ok) {
        setError(payload.message ?? "Payment initialization failed.");
        return;
      }
      setResult(payload);
    } catch {
      setError("Could not reach payment service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="py-5">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={6}>
            <Card>
              <Card.Body>
                <Card.Title className="mb-2">QR Payment Terminal</Card.Title>
                <Card.Subtitle className="mb-4 text-muted">
                  Instant in-store bank transfer through Comgate
                </Card.Subtitle>

                <Form onSubmit={submitPayment}>
                  <Form.Group controlId="amountCzk">
                    <Form.Label>Amount to pay</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        min="1"
                        step="0.01"
                        required
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                      />
                      <InputGroup.Text>CZK</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>

                  <Button className="mt-3 w-100" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Creating payment...
                      </>
                    ) : (
                      "Create bank transfer payment"
                    )}
                  </Button>
                </Form>

                {error && (
                  <Alert variant="danger" className="mt-4 mb-0">
                    {error}
                  </Alert>
                )}

                {result?.paymentUrl && (
                  <Alert variant="success" className="mt-4 mb-0">
                    <div className="fw-semibold">Payment initialized.</div>
                    {result.transactionId && <div>Transaction ID: {result.transactionId}</div>}
                    <a href={result.paymentUrl} target="_blank" rel="noopener noreferrer">
                      Open customer payment page
                    </a>
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  );
}
