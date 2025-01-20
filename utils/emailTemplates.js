const emailVerificationTemplate = (otp, otpExpires) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
      color: #333333;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border: 1px solid #dddddd;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #007BFF;
      font-size: 24px;
      margin-bottom: 20px;
    }
    p {
      font-size: 16px;
      margin: 10px 0;
    }
    .otp-code {
      font-size: 22px;
      font-weight: bold;
      color: #FF5C5C;
      text-align: center;
      margin: 20px 0;
    }
    .footer {
      margin-top: 20px;
      font-size: 14px;
      color: #888888;
      text-align: center;
    }
    a {
      color: #007BFF;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <h1>Email Verification</h1>
    <p>Thank you for signing up! To complete your registration, please verify your email address by entering the code below:</p>
    <div class="otp-code">${otp}</div>
    <p>
      This code is valid for the next <strong>${Math.ceil(
        (otpExpires - Date.now()) / 60000
      )} minutes</strong>. 
      If you did not request this, please ignore this email.
    </p>
    <p>Best regards,<br>The Team</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <div class="footer">
      <p>If you have any questions, contact us at <a href="mailto:support@example.com">support@example.com</a>.</p>
    </div>
    <footer style="font-size: 14px; color: #999; text-align: center;">
      © ${new Date().getFullYear()} Your Company. All rights reserved.
    </footer>
  </div>
</body>
</html>
`;

module.exports = { emailVerificationTemplate };
