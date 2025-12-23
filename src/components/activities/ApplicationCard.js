'use client';

import { Card, Button, Badge, Avatar } from "flowbite-react";
import { HiCheck, HiX, HiClock, HiDocumentText } from "react-icons/hi";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { formatDate } from "@/utils/dateUtils";

/**
 * Pure presentational chat-style application card component.
 * Shows:
 * - NPO logo + activity title + status
 * - Member message, NPO response, optional cancellation message
 * - Actions: view activity, cancel (member) or accept/reject (NPO)
 */
export default function ApplicationCard({
  application,
  activity,
  memberProfile,
  onOpenActivity,
  onCancelClick,
  onAcceptClick,
  onRejectClick,
  onMemberAvatarClick,
  onOrgLogoClick,
  isProcessing = false,
  // Add these new props for translated strings
  acceptLabel,
  rejectLabel,
}) {
  const t = useTranslations("Dashboard");

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

  const renderMessageBubble = (
    side,
    avatarSrc,
    name,
    text,
    dateLabel,
    tone = "user",
    onAvatarClick = null
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
              <Avatar 
                img={avatarSrc} 
                rounded 
                size="sm" 
                className={onAvatarClick ? "cursor-pointer" : ""}
                onClick={onAvatarClick}
              />
            ) : (
              <div 
                className={`w-8 h-8 rounded-full bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center text-xs font-semibold text-white ${onAvatarClick ? "cursor-pointer" : ""}`}
                onClick={onAvatarClick}
              >
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
              <Avatar 
                img={avatarSrc} 
                rounded 
                size="sm" 
                className={onAvatarClick ? "cursor-pointer" : ""}
                onClick={onAvatarClick}
              />
            ) : (
              <div 
                className={`w-8 h-8 rounded-full bg-primary-500 dark:bg-primary-600 flex items-center justify-center text-xs font-semibold text-white ${onAvatarClick ? "cursor-pointer" : ""}`}
                onClick={onAvatarClick}
              >
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
                className={`rounded-full flex-shrink-0 ${onOrgLogoClick ? "cursor-pointer" : ""}`}
                onClick={onOrgLogoClick}
              />
            ) : (
              <div 
                className={`w-10 h-10 rounded-full bg-neutral-300 dark:bg-neutral-700 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 ${onOrgLogoClick ? "cursor-pointer" : ""}`}
                onClick={onOrgLogoClick}
              >
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
            "user",
            onMemberAvatarClick
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
              "cancel",
              onMemberAvatarClick
            )}
        </div>

        {/* Footer actions */}
        <div className="mt-4 pt-3 border-t border-border-light dark:border-border-dark flex flex-wrap gap-2 justify-between">
          {onOpenActivity && (
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
          )}

          {status === "pending" && (
            <>
              {onCancelClick && (
                <Button
                  size="xs"
                  color="failure"
                  onClick={onCancelClick}
                  className="text-xs sm:text-sm bg-semantic-error-600 hover:bg-semantic-error-700 dark:bg-semantic-error-500 dark:hover:bg-semantic-error-600"
                >
                  <HiX className="h-4 w-4 mr-1" />
                  {t("cancelApplication") || "Cancel application"}
                </Button>
              )}
              {onAcceptClick && onRejectClick && (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    color="success"
                    onClick={onAcceptClick}
                    disabled={isProcessing}
                    className="flex items-center justify-center gap-1 flex-1 sm:flex-none"
                  >
                    <HiCheck className="h-4 w-4" />
                    <span>{acceptLabel || "Accept"}</span>
                  </Button>
                  <Button
                    size="sm"
                    color="failure"
                    onClick={onRejectClick}
                    disabled={isProcessing}
                    className="flex items-center justify-center gap-1 flex-1 sm:flex-none"
                  >
                    <HiX className="h-4 w-4" />
                    <span>{rejectLabel || "Reject"}</span>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        </div>
      </Card>
    </>
  );
}


