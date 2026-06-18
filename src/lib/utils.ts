import dayjs from "dayjs";
import "dayjs/locale/th";
import relativeTime from "dayjs/plugin/relativeTime";
import buddhistEra from "dayjs/plugin/buddhistEra";

dayjs.extend(relativeTime);
dayjs.extend(buddhistEra )
dayjs.locale("th");

export function formatThaiDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return dayjs(date).format("DD/MM/BBBB HH:mm");
}

export function formatOdometer(value: number | null | undefined): string {
  if (value == null) return "-";
  
  return value.toLocaleString("th-TH") + " กม.";
}

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

export function getVehicleQrUrl(vehicleId: string): string {
  return `${getBaseUrl()}/vehicle/${vehicleId}`;
}