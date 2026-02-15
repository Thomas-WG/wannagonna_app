/**
 * Email template generators for Mailgun emails
 * These functions generate both plain text and HTML versions of emails
 */

/**
 * Generate a generic notification email (title + body, optional link).
 * @param {Object} params
 * @param {string} params.title - Email subject and heading
 * @param {string} params.body - Notification body text
 * @param {string|null} [params.link] - Optional app path (e.g. "/dashboard")
 * @return {{subject: string, text: string, html: string}}
 */
export function generateNotificationEmail({title, body, link = null}) {
  const subject = title;

  let emailText = `${body}\n\n`;
  if (link) {
    emailText += `View in app: ${link}\n\n`;
  }
  emailText += "— WannaGonna\n";

  let emailHtml = `<div style="font-family: Arial, sans-serif; ` +
    `line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">`;
  const escapedBody = (body || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  emailHtml += `<p style="font-size: 16px; margin-bottom: 20px; ` +
    `white-space: pre-wrap;">${escapedBody}</p>`;
  if (link) {
    emailHtml += `<p style="margin-top: 16px; font-size: 14px; color: #666;">` +
      `View in app: ${link.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
  }
  emailHtml += `<p style="margin-top: 24px; font-size: 12px; color: #999;">` +
    `— WannaGonna</p>`;
  emailHtml += `</div>`;

  return {
    subject,
    text: emailText,
    html: emailHtml,
  };
}

/**
 * Generate application approval introduction email
 * @param {Object} params
 * @param {string} params.activityTitle - Title of the activity
 * @param {string} params.participantName - Name of the participant/volunteer
 * @param {string} params.participantEmail - Email of the participant
 * @param {string} params.validatorName - Name of the NPO validator
 * @param {string} params.validatorEmail - Email of the NPO validator
 * @param {string|null} [params.npoResponse] - Optional message from
 *   the organization
 * @param {string} [params.locale='en'] - Locale for future i18n support
 * @return {{subject: string, text: string, html: string}}
 */
export function generateApplicationApprovalEmail({
  activityTitle,
  participantName,
  participantEmail,
  validatorName,
  validatorEmail,
  npoResponse = null,
  locale = "en",
}) {
  const subject = `🎉 Great news! You're connected for "${activityTitle}"`;

  // Plain text version
  let emailText = `🎉 Great News! 🎉\n\n`;
  emailText += `We're thrilled to let you know that your connection has been ` +
    `made!\n\n`;
  emailText += `Activity: ${activityTitle}\n\n`;
  emailText += `Meet each others:\n`;
  emailText += `• ${participantName} (${participantEmail})\n`;
  emailText += `• ${validatorName} (${validatorEmail})\n\n`;
  emailText += `We're excited to see you both work together on ` +
    `this meaningful project. `;
  emailText += `This collaboration is a wonderful opportunity to ` +
    `make a positive impact, `;
  emailText += `and we're confident that you'll create something ` +
    `amazing together!\n\n`;

  if (npoResponse) {
    emailText += `-----------------------------------\n`;
    emailText += `Message from the organization:\n`;
    emailText += `${npoResponse}\n\n`;
    emailText += `-----------------------------------\n`;
  }

  emailText += `We hope this connection will be fruitful and that ` +
    `you'll both benefit `;
  emailText += `from this collaborative experience. Feel free to ` +
    `reach out to each other `;
  emailText += `to discuss the next steps and how you'd like to ` +
    `proceed.\n\n`;
  emailText += `Best of luck with your collaboration! 🌟\n\n`;

  // HTML version with formatting
  let emailHtml = `<div style="font-family: Arial, sans-serif; ` +
    `line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">`;
  emailHtml += `<h2 style="color: #4CAF50; margin-bottom: 20px;">` +
    `🎉 Great News! 🎉</h2>`;
  emailHtml += `<p style="font-size: 16px; margin-bottom: 20px;">`;
  emailHtml += `We're thrilled to let you know that your ` +
    `connection has been made!`;
  emailHtml += `</p>`;
  emailHtml += `<p style="margin-bottom: 10px;"><strong>Activity:</strong> ` +
    `${activityTitle}</p>`;
  emailHtml += `<p style="margin-bottom: 10px;"><strong>Meet each ` +
    `others:</strong></p>`;
  emailHtml += `<ul style="margin-bottom: 20px; padding-left: 20px;">`;
  emailHtml += `<li style="margin-bottom: 8px;">${participantName} ` +
    `(${participantEmail})</li>`;
  emailHtml += `<li style="margin-bottom: 8px;">${validatorName} ` +
    `(${validatorEmail})</li>`;
  emailHtml += `</ul>`;
  emailHtml += `<p style="margin-bottom: 20px;">`;
  emailHtml += `We're excited to see you both work together on ` +
    `this meaningful project. `;
  emailHtml += `This collaboration is a wonderful opportunity to ` +
    `make a positive impact, `;
  emailHtml += `and we're confident that you'll create something ` +
    `amazing together!`;
  emailHtml += `</p>`;

  if (npoResponse) {
    emailHtml += `<hr style="border: none; border-top: 1px solid #ddd; ` +
      `margin: 20px 0;">`;
    emailHtml += `<p style="margin-bottom: 10px;"><strong>Message ` +
      `from the organization:</strong></p>`;
    emailHtml += `<div style="background-color: #f5f5f5; padding: 15px; ` +
      `border-left: 4px solid #2196F3; margin: 10px 0; ` +
      `border-radius: 4px;">`;
    emailHtml += `<p style="margin: 0; white-space: pre-wrap;">` +
      `${npoResponse.replace(/\n/g, "<br>")}</p>`;
    emailHtml += `</div>`;
    emailHtml += `<hr style="border: none; border-top: 1px solid #ddd; ` +
      `margin: 20px 0;">`;
  }

  emailHtml += `<p style="margin-bottom: 20px;">`;
  emailHtml += `We hope this connection will be fruitful and that ` +
    `you'll both benefit `;
  emailHtml += `from this collaborative experience. Feel free to ` +
    `reach out to each other `;
  emailHtml += `to discuss the next steps and how you'd like to ` +
    `proceed.`;
  emailHtml += `</p>`;
  emailHtml += `<p style="margin-top: 20px; font-weight: bold; ` +
    `color: #4CAF50;">`;
  emailHtml += `Best of luck with your collaboration! 🌟`;
  emailHtml += `</p>`;
  emailHtml += `</div>`;

  return {
    subject,
    text: emailText,
    html: emailHtml,
  };
}

