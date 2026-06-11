import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "Europe/Lisbon",
    weekday: "long",
    day: "2-digit",
    month: "long"
  }).format(date);
}

export function formatKickoff(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "Europe/Lisbon",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}

export function formatBidCountdown(iso: string) {
  const diffMs = new Date(iso).getTime() - Date.now();

  if (diffMs <= 0) {
    return "Bid fechada";
  }

  const totalMinutes = Math.ceil(diffMs / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `Fecha em ${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `Fecha em ${hours}h ${minutes}min`;
  }

  return `Fecha em ${minutes}min`;
}

export function formatEuro(value: number | string) {
  const amount = typeof value === "string" ? Number(value) : value;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function toDateInputValue(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const year = values.year;
  const month = values.month;
  const day = values.day;
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function dayBounds(dateValue?: string) {
  const date = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();
  const dayValue = dateValue || toDateInputValue(date);
  const start = portugalDateTimeToDate(`${dayValue}T00:00`);
  const endDay = addDays(new Date(`${dayValue}T00:00:00`), 1);
  const end = portugalDateTimeToDate(`${toDateInputValue(endDay)}T00:00`);

  return {
    date,
    start: start.toISOString(),
    end: end.toISOString()
  };
}

function timeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return asUtc - date.getTime();
}

function portugalDateTimeToDate(value: string) {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offset = timeZoneOffsetMs(utcGuess, "Europe/Lisbon");

  return new Date(utcGuess.getTime() - offset);
}

export function canPredict(match: { status: string; bid_closes_at: string }) {
  return match.status !== "finished" && Date.now() < new Date(match.bid_closes_at).getTime();
}
