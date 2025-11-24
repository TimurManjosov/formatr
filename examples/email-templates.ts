import { template } from '../src';

const welcomeEmail = template<{
  user: { name: string; email: string };
  verifyUrl: string;
}>(
  `Hi {user.name|upper},

Welcome to our platform! Please verify your email address ({user.email}) by clicking the link below:

{verifyUrl}

Thanks,
The Team`
);

console.log('=== Email Template Examples ===\n');

console.log(welcomeEmail({
  user: { name: "Alice", email: "alice@example.com" },
  verifyUrl: "https://example.com/verify/abc123",
}));

console.log('\n--- Password Reset Email ---\n');

const passwordResetEmail = template<{
  user: { name: string };
  resetUrl: string;
  expiryHours: number;
}>(
  `Hello {user.name},

We received a request to reset your password. Click the link below to create a new password:

{resetUrl}

This link will expire in {expiryHours} hours.

If you didn't request this, please ignore this email.

Best regards,
Security Team`
);

console.log(passwordResetEmail({
  user: { name: "Bob" },
  resetUrl: "https://example.com/reset/xyz789",
  expiryHours: 24,
}));

console.log('\n--- Order Confirmation Email ---\n');

const orderConfirmation = template<{
  customer: { name: string };
  orderNumber: string;
  total: number;
  itemCount: number;
}>(
  `Dear {customer.name},

Thank you for your order!

Order Number: {orderNumber}
Total: {total|currency:USD}
Items: {itemCount|plural:item,items}

Your order will be shipped within 2-3 business days.

Thank you for shopping with us!`
, { locale: "en-US" });

console.log(orderConfirmation({
  customer: { name: "Charlie" },
  orderNumber: "ORD-2025-001",
  total: 149.99,
  itemCount: 3,
}));
