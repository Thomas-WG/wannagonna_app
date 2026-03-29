'use client';

import {
  HiPencil,
  HiTrash,
  HiEye,
  HiUserGroup,
  HiQrcode,
  HiDuplicate,
  HiUsers,
} from 'react-icons/hi';
import { HiDocumentText } from "react-icons/hi2";

const tier1ButtonClass =
  'flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-lg ring-2 ring-white/30 transition-colors touch-manipulation sm:h-[3.75rem] sm:w-[3.75rem]';

const tier2ButtonClass =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-md transition-opacity touch-manipulation hover:opacity-95 active:opacity-90 sm:h-10 sm:w-10';

/**
 * Two-tier quick actions on activity cards: status/destructive (prominent) + compact navigation grid.
 */
export default function ActivityCardActionsOverlay({
  activity,
  onClose,
  onChangeStatus,
  onEdit,
  onDuplicate,
  onDelete,
  onView,
  onApplications,
  onParticipants,
  onQRCode,
  labels,
}) {
  const hasQRCode = activity.qr_code_token && (activity.type === 'local' || activity.type === 'event');
  const isEvent = activity.type === 'event';
  const showEdit = activity.status !== 'Closed';

  return (
    <div className="absolute inset-0 z-10 flex min-h-0 flex-col rounded-lg bg-black/60 pt-12 pb-3 pl-2 pr-2 sm:pt-14 sm:pl-3 sm:pr-3">
      {/* justify-start (not center): centered flex + overflow clips the top of tall content */}
      <div className="mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col items-center justify-start gap-3 overflow-y-auto overscroll-contain px-1.5 pb-3 pt-2">
        {/* Tier 1 — status & destructive; padding so ring-2 is not clipped by overflow */}
        <div className="flex shrink-0 items-start justify-center gap-6 px-0.5 pb-0.5 pt-0.5 sm:gap-10">
          <div className="flex max-w-[6rem] flex-col items-center gap-1">
            <button
              type="button"
              onClick={onChangeStatus}
              className={`${tier1ButtonClass} bg-orange-500 hover:bg-orange-600 active:bg-orange-700`}
              aria-label={labels.changeStatus}
            >
              <HiDocumentText className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
            <span className="text-center text-[11px] font-semibold leading-tight text-white sm:text-xs">
              {labels.changeStatus}
            </span>
          </div>
          <div className="flex max-w-[6rem] flex-col items-center gap-1">
            <button
              type="button"
              onClick={onDelete}
              className={`${tier1ButtonClass} bg-red-500 hover:bg-red-600 active:bg-red-700`}
              aria-label={labels.delete}
            >
              <HiTrash className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
            <span className="text-center text-[11px] font-semibold leading-tight text-white sm:text-xs">
              {labels.delete}
            </span>
          </div>
        </div>

        <div className="h-px w-[90%] max-w-xs shrink-0 bg-white/20" aria-hidden />

        {/* Tier 2 — navigation & workflows (compact) */}
        <div className="flex w-full max-w-xs flex-wrap justify-center gap-x-2 gap-y-2 px-0.5 sm:gap-x-2.5">
          <div className="flex w-[4.25rem] flex-col items-center gap-0.5 sm:w-[4.5rem]">
            <button
              type="button"
              onClick={onView}
              className={`${tier2ButtonClass} bg-purple-500`}
              aria-label={labels.view}
            >
              <HiEye className="h-5 w-5" />
            </button>
            <span className="line-clamp-2 min-h-[1.75rem] px-px text-center text-[9px] font-medium leading-tight text-white sm:text-[10px]">
              {labels.view}
            </span>
          </div>
          {showEdit && (
            <div className="flex w-[4.25rem] flex-col items-center gap-0.5 sm:w-[4.5rem]">
              <button
                type="button"
                onClick={onEdit}
                className={`${tier2ButtonClass} bg-blue-500`}
                aria-label={labels.edit}
              >
                <HiPencil className="h-5 w-5" />
              </button>
              <span className="line-clamp-2 min-h-[1.75rem] px-px text-center text-[9px] font-medium leading-tight text-white sm:text-[10px]">
                {labels.edit}
              </span>
            </div>
          )}
          <div className="flex w-[4.25rem] flex-col items-center gap-0.5 sm:w-[4.5rem]">
            <button
              type="button"
              onClick={onDuplicate}
              className={`${tier2ButtonClass} bg-yellow-500`}
              aria-label={labels.duplicate}
            >
              <HiDuplicate className="h-5 w-5" />
            </button>
            <span className="line-clamp-2 min-h-[1.75rem] px-px text-center text-[9px] font-medium leading-tight text-white sm:text-[10px]">
              {labels.duplicate}
            </span>
          </div>
          {!isEvent && (
            <div className="flex w-[4.25rem] flex-col items-center gap-0.5 sm:w-[4.5rem]">
              <button
                type="button"
                onClick={onApplications}
                className={`${tier2ButtonClass} bg-green-500`}
                aria-label={labels.applications}
              >
                <HiUserGroup className="h-5 w-5" />
              </button>
              <span className="line-clamp-2 min-h-[1.75rem] px-px text-center text-[9px] font-medium leading-tight text-white sm:text-[10px]">
                {labels.applications}
              </span>
            </div>
          )}
          <div className="flex w-[4.25rem] flex-col items-center gap-0.5 sm:w-[4.5rem]">
            <button
              type="button"
              onClick={onParticipants}
              className={`${tier2ButtonClass} bg-teal-500`}
              aria-label={labels.viewParticipants}
            >
              <HiUsers className="h-5 w-5" />
            </button>
            <span className="line-clamp-2 min-h-[1.75rem] px-px text-center text-[9px] font-medium leading-tight text-white sm:text-[10px]">
              {labels.viewParticipants}
            </span>
          </div>
          {hasQRCode && (
            <div className="flex w-[4.25rem] flex-col items-center gap-0.5 sm:w-[4.5rem]">
              <button
                type="button"
                onClick={onQRCode}
                className={`${tier2ButtonClass} bg-indigo-500`}
                aria-label={labels.showQRCode}
              >
                <HiQrcode className="h-5 w-5" />
              </button>
              <span className="line-clamp-2 min-h-[1.75rem] px-px text-center text-[9px] font-medium leading-tight text-white sm:text-[10px]">
                {labels.showQRCode}
              </span>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-gray-600 text-xl leading-none text-white touch-manipulation hover:bg-gray-700 active:bg-gray-800 sm:h-8 sm:w-8 sm:text-lg md:h-9 md:w-9 md:text-xl"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}
