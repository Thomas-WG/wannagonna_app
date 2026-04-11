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

/**
 * Build activity alert email content.
 * @param {Object} params
 * @param {string} params.displayName
 * @param {Array<Object>} params.activities
 * @param {"daily"|"weekly"} params.frequency
 * @return {{subject: string, text: string, html: string}}
 */
export function buildActivityAlertEmail({displayName, activities, frequency}) {
  const count = Array.isArray(activities) ? activities.length : 0;
  const timeLabel = frequency === "daily" ? "today" : "this week";
  const safeName = displayName || "there";
  const subject = `Your WannaGonna activity alert — ${count} new ${timeLabel}`;

  // Match src/constant/designTokens.js activityType.*.500 (Explore / ActivityCard)
  const typeBadgeColor = (type) => {
    if (type === "local") return "#10b981";
    if (type === "event") return "#8b5cf6";
    if (type === "online") return "#0ea5e9";
    return "#64748b";
  };

  const textItems = (activities || []).map((activity) =>
    `${activity.title || "Untitled activity"} — ` +
    `${activity.organization_name || "Unknown organization"} ` +
    `(${activity.type || "unknown"}, ${activity.country || "N/A"}) — ` +
    `XP: ${activity.xp_reward || 0} — ` +
    `Link: /explore?activityId=${activity.id}`,
  );
  const text = [
    `Hi ${safeName}, here are ${count} new activities matching your alert criteria.`,
    "",
    ...textItems,
    "",
    "You can manage your alerts in your WannaGonna profile.",
  ].join("\n");

  const cardsHtml = (activities || []).map((activity) => {
    const link = `/explore?activityId=${activity.id}`;
    const badgeColor = typeBadgeColor(activity.type);
    return `<div style="border: 1px solid #E5E7EB; border-radius: 10px;` +
      ` padding: 16px; margin-bottom: 14px;">` +
      `<a href="${link}" style="display: inline-block; margin-bottom: 10px;` +
      ` color: #009AA2; font-family: 'Montserrat Alternates', Arial, sans-serif;` +
      ` font-size: 18px; font-weight: 700; text-decoration: none;">` +
      `${activity.title || "Untitled activity"}</a>` +
      `<div style="font-family: 'DM Sans', Arial, sans-serif; color: #1A1A1A;` +
      ` font-size: 14px; margin-bottom: 8px;">` +
      `${activity.organization_name || "Unknown organization"}</div>` +
      `<span style="display: inline-block; background: ${badgeColor};` +
      ` color: #FFFFFF; border-radius: 999px; padding: 4px 10px;` +
      ` font-family: 'DM Sans', Arial, sans-serif; font-size: 12px;` +
      ` margin-right: 8px; text-transform: uppercase;">` +
      `${activity.type || "online"}</span>` +
      `<span style="font-family: 'DM Sans', Arial, sans-serif; color: #1A1A1A;` +
      ` font-size: 13px; margin-right: 12px;">` +
      `${activity.country || "N/A"}</span>` +
      `<span style="font-family: 'DM Sans', Arial, sans-serif; color: #F08602;` +
      ` font-size: 13px; font-weight: 700;">XP: ${activity.xp_reward || 0}</span>` +
      `</div>`;
  }).join("");

  const html =
    `<div style="background: #F6F9FB; padding: 20px;">` +
    `<div style="max-width: 600px; margin: 0 auto; background: #FFFFFF;` +
    ` border-radius: 12px; overflow: hidden; border: 1px solid #E5E7EB;">` +
    `<div style="padding: 24px 24px 12px 24px; border-bottom: 1px solid #EEF2F7;">` +
    `<div style="font-family: 'Montserrat Alternates', Arial, sans-serif;` +
    ` color: #009AA2; font-size: 28px; font-weight: 700; letter-spacing: 0.2px;">` +
    `WannaGonna</div>` +
    `<div style="font-family: 'DM Sans', Arial, sans-serif; color: #1A1A1A;` +
    ` font-size: 14px; margin-top: 4px;">Make a difference today.</div>` +
    `</div>` +
    `<div style="padding: 20px 24px;">` +
    `<p style="margin: 0 0 16px 0; font-family: 'DM Sans', Arial, sans-serif;` +
    ` color: #1A1A1A; font-size: 15px;">` +
    `Hi ${safeName}, here are ${count} new activities matching your alert criteria.` +
    `</p>` +
    cardsHtml +
    `</div>` +
    `<div style="padding: 16px 24px 22px 24px; border-top: 1px solid #EEF2F7;">` +
    `<p style="margin: 0 0 8px 0; font-family: 'DM Sans', Arial, sans-serif;` +
    ` color: #CD1436; font-size: 12px;">` +
    `You can manage your alerts in your WannaGonna profile.</p>` +
    `<p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif;` +
    ` color: #1A1A1A; font-size: 12px;">` +
    `© WannaGonna. All rights reserved.</p>` +
    `</div>` +
    `</div>` +
    `</div>`;

  return {subject, text, html};
}

