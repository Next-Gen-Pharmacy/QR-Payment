"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Alert, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { useSearchParams } from "next/navigation";

type KnownStatus = "PAID" | "CANCELLED" | "PENDING" | "AUTHORIZED" | "UNKNOWN";

/** Poll interval in milliseconds. */
const POLL_INTERVAL_MS = 3_000;

/** Stop polling after this many milliseconds and show a timeout message. */
const POLL_TIMEOUT_MS = 5 * 60 * 1_000;

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const transId = searchParams.get("transId");

  const [status, setStatus] = useState<KnownStatus>("UNKNOWN");
  const [timedOut, setTimedOut] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!transId) return;

    const poll = async () => {
      try {
        const response = await fetch(`/api/payments/comgate/status?transId=${encodeURIComponent(transId)}`);
        if (!response.ok) return;
        const data = (await response.json()) as { status: KnownStatus };
        setStatus(data.status);
        if (data.status === "PAID" || data.status === "CANCELLED") {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }
      } catch {
        // network error — keep polling
      }
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setTimedOut(true);
    }, POLL_TIMEOUT_MS);

    return () => {
      clearInterval(intervalRef.current!);
      clearTimeout(timeoutRef.current!);
    };
  }, [transId]);

  const renderBody = () => {
    if (!transId) {
      return (
        <Alert variant="warning" className="mb-0">
          No transaction ID found. Please return to the payment terminal.
        </Alert>
      );
    }

    if (status === "PAID") {
      return (
        <Alert variant="success" className="mb-0">
          <Alert.Heading>Payment confirmed</Alert.Heading>
          <p className="mb-1">The bank transfer was received successfully.</p>
          <small className="text-muted">Transaction ID: {transId}</small>
        </Alert>
      );
    }

    if (status === "CANCELLED") {
      return (
        <Alert variant="danger" className="mb-0">
          <Alert.Heading>Payment cancelled</Alert.Heading>
          <p className="mb-1">The payment was cancelled or rejected.</p>
          <small className="text-muted">Transaction ID: {transId}</small>
        </Alert>
      );
    }

    if (timedOut) {
      return (
        <Alert variant="warning" className="mb-0">
          <Alert.Heading>Still waiting for confirmation</Alert.Heading>
          <p className="mb-1">
            Bank transfers can take several minutes. Please check back later or contact support.
          </p>
          <small className="text-muted">Transaction ID: {transId}</small>
        </Alert>
      );
    }

    return (
      <Alert variant="info" className="mb-0">
        <div className="d-flex align-items-center gap-2 mb-1">
          <Spinner size="sm" />
          <span className="fw-semibold">Waiting for payment confirmation…</span>
        </div>
        <p className="mb-1">
          Your bank transfer is being processed. This page updates automatically.
        </p>
        <small className="text-muted">Transaction ID: {transId}</small>
      </Alert>
    );
  };

  return (
    <>
      {renderBody()}
      <a href="/" className="btn btn-outline-secondary mt-4 w-100">
        Back to payment terminal
      </a>
    </>
  );
}

export default function PaymentResult() {
  return (
    <main className="py-5">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={6}>
            <Card>
              <Card.Body>
                <Card.Title className="mb-4">Payment Status</Card.Title>
                <Suspense
                  fallback={
                    <div className="d-flex align-items-center gap-2">
                      <Spinner size="sm" />
                      <span>Loading…</span>
                    </div>
                  }
                >
                  <PaymentResultContent />
                </Suspense>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  );
}
