import type { Vehicle, VehicleLog, Driver } from "@/db/schema";

// แถวบันทึกการใช้งานจาก /api/logs (join กับยานพาหนะ + พนักงานขับรถ)
// vehicle/driver เป็น null ได้ เพราะใช้ left join
export type LogRow = {
    log: VehicleLog;
    vehicle: Pick<Vehicle, "id" | "plateNumber" | "name" | "type"> | null;
    driver: Pick<Driver, "id" | "firstName" | "lastName" | "phone"> | null;
};

// แถวยานพาหนะจาก /api/vehicles (join กับผู้รับผิดชอบรถ)
export type VehicleRow = {
    vehicle: Vehicle;
    responsibleDriver: Pick<Driver, "id" | "firstName" | "lastName" | "phone"> | null;
};
