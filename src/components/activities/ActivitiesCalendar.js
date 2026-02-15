'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import allLocales from '@fullcalendar/core/locales-all';
import { designTokens } from '@/constant/designTokens';

/**
 * Normalize activity start_date to a Date (handles Firestore timestamp or Date).
 */
function toDate(value) {
  if (!value) return null;
  if (value.seconds != null) return new Date(value.seconds * 1000);
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
}

/**
 * Combine date (Date at midnight) with time string "HH:mm" into a single Date.
 */
function combineDateAndTime(date, timeStr) {
  if (!date || !timeStr) return null;
  const d = toDate(date);
  if (!d) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  const out = new Date(d);
  out.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return out;
}

/**
 * Map activity to FullCalendar event. Only call for activities with start_date.
 * FullCalendar end is exclusive.
 */
function activityToEvent(activity) {
  const startDate = toDate(activity.start_date);
  if (!startDate) return null;

  const hasTime = activity.start_time || activity.end_time;
  const allDay = !hasTime;

  let start;
  let end;

  if (allDay) {
    start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDate = activity.end_date ? toDate(activity.end_date) : null;
    if (endDate) {
      end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1);
    } else {
      end = new Date(start.getTime());
      end.setDate(end.getDate() + 1);
    }
  } else {
    start = activity.start_time
      ? combineDateAndTime(activity.start_date, activity.start_time)
      : new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateRaw = activity.end_date || activity.start_date;
    const endDate = toDate(endDateRaw);
    if (activity.end_time) {
      end = combineDateAndTime(endDateRaw, activity.end_time);
    } else if (endDateRaw) {
      end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1);
    } else {
      end = new Date(start.getTime());
      end.setHours(end.getHours() + 1, end.getMinutes(), 0, 0);
    }
  }

  const typeColors = designTokens.colors.activityType;
  const type = activity.type && typeColors[activity.type] ? activity.type : 'online';
  const color = typeColors[type][500];
  const borderColor = typeColors[type][600];

  return {
    id: activity.id,
    title: activity.title || '',
    start,
    end,
    allDay,
    backgroundColor: color,
    borderColor: borderColor || color,
    extendedProps: {
      type: activity.type,
      category: activity.category,
      organization_name: activity.organization_name,
      description: activity.description,
      status: activity.status,
    },
  };
}

const MOBILE_BREAKPOINT = 768;

/** Map next-intl locale to FullCalendar locale code (e.g. en-US -> en). */
function toFullCalendarLocale(locale) {
  if (!locale || typeof locale !== 'string') return 'en';
  const base = locale.split(/[-_]/)[0].toLowerCase();
  return base || 'en';
}

export default function ActivitiesCalendar({ activities = [], onEventClick, locale: localeProp }) {
  const calendarLocale = toFullCalendarLocale(localeProp);
  const calendarRef = useRef(null);
  const [width, setWidth] = useState(1024);
  const isMobile = width < MOBILE_BREAKPOINT;

  useEffect(() => {
    const updateWidth = () => setWidth(window.innerWidth);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const hasAppliedMobileView = useRef(false);
  useEffect(() => {
    if (!isMobile) {
      hasAppliedMobileView.current = false;
      return;
    }
    const api = calendarRef.current?.getApi?.();
    if (!api) return;
    const view = api.view?.type;
    if (view === 'timeGridWeek' || view === 'timeGridDay') {
      api.changeView('listWeek');
    } else if (!hasAppliedMobileView.current) {
      hasAppliedMobileView.current = true;
      api.changeView('listWeek');
    }
  }, [isMobile]);

  const events = useMemo(() => {
    return activities
      .filter((a) => a.start_date)
      .map(activityToEvent)
      .filter(Boolean);
  }, [activities]);

  const handleEventClick = (info) => {
    const id = info.event.id;
    if (id && onEventClick) onEventClick(id);
  };

  const handleDateClick = (info) => {
    const api = calendarRef.current?.getApi?.();
    if (api && info.date) {
      if (isMobile) {
        api.gotoDate(info.date);
        api.changeView('listWeek');
      } else {
        api.changeView('timeGridDay', info.date);
      }
    }
  };

  const handleWindowResize = () => {
    const api = calendarRef.current?.getApi?.();
    if (api && window.innerWidth < MOBILE_BREAKPOINT) {
      const view = api.view?.type;
      if (view === 'timeGridWeek' || view === 'timeGridDay') {
        api.changeView('listWeek');
      }
    }
  };

  return (
    <div className="activities-calendar min-h-[400px] w-full" style={{ minHeight: '400px' }}>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, listPlugin, timeGridPlugin, interactionPlugin]}
        locales={allLocales}
        locale={calendarLocale}
        firstDay={1}
        navLinks
        nowIndicator
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: isMobile ? 'dayGridMonth,listWeek' : 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
        }}
        events={events}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        dayMaxEvents={3}
        moreLinkClick="popover"
        height="auto"
        contentHeight="auto"
        aspectRatio={1.5}
        eventDisplay="block"
        views={{
          listWeek: { buttonText: 'List' },
          dayGridMonth: { buttonText: 'Month' },
          timeGridWeek: { buttonText: 'Week' },
          timeGridDay: { buttonText: 'Day' },
        }}
        windowResize={handleWindowResize}
      />
    </div>
  );
}
