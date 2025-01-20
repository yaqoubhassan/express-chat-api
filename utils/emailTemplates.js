const emailVerificationTemplate = (otp) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: #f4f4f9;
      color: #333333;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border: 1px solid #dddddd;
      border-radius: 8px;
      padding: 20px;
    }
    h1 {
      color: #2d89ef;
      font-size: 24px;
    }
    p {
      font-size: 16px;
    }
    .otp-code {
      font-size: 20px;
      font-weight: bold;
      color: #ff5c5c;
    }
    .footer {
      margin-top: 20px;
      font-size: 14px;
      color: #888888;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <h1>Email Verification</h1>
    <p>Thank you for registering! To complete your registration, please verify your email address by entering the code below:</p>
    <div class="otp-code">${otp}</div>
    <p>This code is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
    <p>Best regards,</p>
    <p>The Team</p>
    <div class="footer">
      <p>If you have any questions, contact us at <a href="mailto:support@example.com">support@example.com</a>.</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = { emailVerificationTemplate };
