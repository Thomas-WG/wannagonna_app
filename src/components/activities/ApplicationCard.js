'use client';

import { Card, Button, Badge, Avatar, Modal, Textarea } from "flowbite-react";
import { HiCheck, HiX, HiClock, HiDocumentText } from "react-icons/hi";
import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatDate } from "@/utils/dateUtils";
import { updateApplicationStatus } from "@/utils/crudApplications";

/**
 * Chat-style application card for the volunteer dashboard.
 * Shows:
 * - NPO logo + activity title + status
 * - Member message, NPO response, optional cancellation message
 * - Actions: view activity, view full application, cancel (pending only)
 */
export default function ApplicationCard({
  application,
  activity,
  memberProfile,
  onOpenActivity,
  onCancelSuccess,
}) {
  const t = useTranslations("Dashboard");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  if (!application || !activity) return null;

  const {
    status,
    createdAt,
    updatedAt,
    message,
    npoResponse,
    cancellationMessage,
    activityId,
    applicationId, // ID in activity's applications subcollection
    id: userApplicationDocId, // ID of doc under member
    userId,
  } = application;

  const orgLogo = activity.organization_logo;
  const orgName = activity.organization_name;
  const activityTitle = activity.title;

  const memberAvatar = memberProfile?.profilePicture || null;
  const memberName =
    memberProfile?.displayName || memberProfile?.name || t("you") || "You";

  const getStatusBadge = (s) => {
    switch (s) {
      case "accepted":
        return (
          <Badge color="success" icon={HiCheck}>
            {t("statusAccepted") || "Accepted"}
          </Badge>
        );
      case "rejected":
        return (
          <Badge color="failure" icon={HiX}>
            {t("statusRejected") || "Rejected"}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge color="gray" icon={HiX}>
            {t("statusCancelled") || "Cancelled"}
          </Badge>
        );
      default:
        return (
          <Badge color="warning" icon={HiClock}>
            {t("statusPending") || "Pending"}
          </Badge>
        );
    }
  };

  const handleConfirmCancel = async () => {
    if (!activityId || !applicationId || !userApplicationDocId) return;

    setIsCancelling(true);
    try {
      // Keep current NPO response; add cancellation message
      await updateApplicationStatus(
        activityId,
        applicationId,
        "cancelled",
        npoResponse || "",
        userId || null,
        cancelMessage.trim() || ""
      );

      if (onCancelSuccess) {
        onCancelSuccess(userApplicationDocId, "cancelled");
      }

      setShowCancelModal(false);
      setCancelMessage("");
    } catch (error) {
      console.error("Error cancelling application from card:", error);
      alert(
        t("errorCancellingApplication") ||
          "Failed to cancel application. Please try again."
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const renderMessageBubble = (
    side,
    avatarSrc,
    name,
    text,
    dateLabel,
    tone = "user"
  ) => {
    if (!text) return null;
    const isRight = side === "right";

    const bubbleBase =
      tone === "user"
        ? "bg-primary-100 dark:bg-primary-800 text-text-primary dark:text-text-primary"
        : tone === "cancel"
        ? "bg-semantic-error-50 dark:bg-semantic-error-900 text-semantic-error-800 dark:text-semantic-error-100"
        : "bg-semantic-info-50 dark:bg-semantic-info-900 text-text-primary dark:text-text-primary";

    const shortText = text.length > 320 ? `${text.slice(0, 320)}…` : text;

    return (
      <div
        className={`flex items-start gap-2 ${
          isRight ? "justify-end" : "justify-start"
        }`}
      >
        {!isRight && (
          <div className="flex-shrink-0">
            {avatarSrc ? (
              <Avatar img={avatarSrc} rounded size="sm" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center text-xs font-semibold text-white">
                {name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>
        )}

        <div
          className={`max-w-[82%] sm:max-w-[70%] flex flex-col ${
            isRight ? "items-end text-right" : "items-start text-left"
          }`}
        >
          <div
            className={`px-3 py-2 rounded-2xl text-xs sm:text-sm shadow-sm ${bubbleBase} ${
              isRight ? "rounded-br-sm" : "rounded-bl-sm"
            }`}
          >
            <div className="font-semibold mb-0.5 text-[11px] sm:text-xs opacity-80">
              {name}
            </div>
            <p className="whitespace-pre-wrap break-words text-xs sm:text-sm">
              {shortText}
            </p>
          </div>
          {text.length > 320 && (
            <div className="mt-0.5 text-[10px] sm:text-xs text-text-secondary dark:text-text-secondary opacity-80">
              {t("showMore") || "Open details to read full message"}
            </div>
          )}
          {dateLabel && (
            <div className="mt-0.5 text-[10px] sm:text-xs text-text-secondary dark:text-text-secondary">
              {dateLabel}
            </div>
          )}
        </div>

        {isRight && (
          <div className="flex-shrink-0">
            {avatarSrc ? (
              <Avatar img={avatarSrc} rounded size="sm" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-500 dark:bg-primary-600 flex items-center justify-center text-xs font-semibold text-white">
                {name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const appliedDateLabel = createdAt ? formatDate(createdAt) : null;
  const responseDateLabel = npoResponse && updatedAt ? formatDate(updatedAt) : null;
  const cancelDateLabel =
    status === "cancelled" && updatedAt ? formatDate(updatedAt) : null;

  return (
    <>
      <Card className="bg-background-card dark:bg-background-card border border-border-light dark:border-border-dark shadow-md hover:shadow-lg transition-shadow h-full">
        <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {orgLogo ? (
              <Image
                src={orgLogo}
                alt={`${orgName} logo`}
                width={40}
                height={40}
                className="rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-neutral-300 dark:bg-neutral-700 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                {orgName?.[0]?.toUpperCase() || "O"}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-semibold text-text-secondary dark:text-text-secondary truncate">
                {orgName}
              </div>
              <div className="text-sm sm:text-base font-bold text-text-primary dark:text-text-primary truncate">
                {activityTitle}
              </div>
              {appliedDateLabel && (
                <div className="text-[11px] sm:text-xs text-text-secondary dark:text-text-secondary">
                  {(t("appliedOn") || "Applied on") + " " + appliedDateLabel}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {getStatusBadge(status)}
          </div>
        </div>

        {/* Chat-style body */}
        <div className="mt-4 space-y-3 flex-1">
          {renderMessageBubble(
            "right",
            memberAvatar,
            memberName,
            message || t("noMessageProvided") || "No message provided",
            appliedDateLabel,
            "user"
          )}

          {npoResponse &&
            renderMessageBubble(
              "left",
              application.lastUpdatedByProfilePicture || orgLogo,
              application.lastUpdatedByDisplayName || orgName,
              npoResponse,
              responseDateLabel,
              "npo"
            )}

          {cancellationMessage &&
            renderMessageBubble(
              "right",
              memberAvatar,
              memberName,
              cancellationMessage,
              cancelDateLabel,
              "cancel"
            )}
        </div>

        {/* Footer actions */}
        <div className="mt-4 pt-3 border-t border-border-light dark:border-border-dark flex flex-wrap gap-2 justify-between">
          <div className="flex gap-2">
            <Button
              size="xs"
              color="light"
              onClick={onOpenActivity}
              className="text-xs sm:text-sm"
            >
              <HiDocumentText className="h-4 w-4 mr-1" />
              {t("viewActivity") || "View activity"}
            </Button>
          </div>

          {status === "pending" && (
            <Button
              size="xs"
              color="failure"
              onClick={() => setShowCancelModal(true)}
              className="text-xs sm:text-sm bg-semantic-error-600 hover:bg-semantic-error-700 dark:bg-semantic-error-500 dark:hover:bg-semantic-error-600"
            >
              <HiX className="h-4 w-4 mr-1" />
              {t("cancelApplication") || "Cancel application"}
            </Button>
          )}
        </div>
        </div>
      </Card>

      {/* Cancel with message modal */}
      <Modal
        show={showCancelModal}
        onClose={() => {
          if (!isCancelling) setShowCancelModal(false);
        }}
        size="md"
      >
        <Modal.Header>
          {t("confirmCancelApplication") || "Confirm Cancellation"}
        </Modal.Header>
        <Modal.Body>
          <p className="text-sm text-text-secondary dark:text-text-secondary mb-3">
            {t("confirmCancelMessage") ||
              "Are you sure you want to cancel this application? This action cannot be undone."}
          </p>
          <label className="block text-sm font-medium mb-1 text-text-primary dark:text-text-primary">
            {t("optionalCancelMessage") || "Cancellation message (optional)"}
          </label>
          <Textarea
            rows={3}
            value={cancelMessage}
            onChange={(e) => setCancelMessage(e.target.value)}
            placeholder={
              t("optionalCancelPlaceholder") ||
              "You can briefly explain why you are cancelling"
            }
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="failure"
            onClick={handleConfirmCancel}
            disabled={isCancelling}
            className="bg-semantic-error-600 hover:bg-semantic-error-700 dark:bg-semantic-error-500 dark:hover:bg-semantic-error-600"
          >
            {isCancelling
              ? t("cancelling") || "Cancelling..."
              : t("confirmCancel") || "Yes, cancel application"}
          </Button>
          <Button
            color="gray"
            onClick={() => setShowCancelModal(false)}
            disabled={isCancelling}
          >
            {t("noKeepIt") || "No, keep it"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}


