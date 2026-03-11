import { DriverProfile } from "@/types/DriverProfile";

export type DriverProfileValidationErrors = Partial<
  Record<keyof DriverProfile, string>
>;

const CAR_PLATE_REGEX = /^\d{4}[A-ZА-ЯӨҮЁ]{3}$/u;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function validateDriverProfile(
  profile: DriverProfile,
): DriverProfileValidationErrors {
  const errors: DriverProfileValidationErrors = {};

  const carNumber = asString(profile.carNumber)
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();

  if (!CAR_PLATE_REGEX.test(carNumber)) {
    errors.carNumber = "Дугаар: 1123УНА эсвэл 1123UNA хэлбэрээр оруулна уу.";
  }

  return errors;
}

export function isDriverProfileValid(profile: DriverProfile): boolean {
  return Object.keys(validateDriverProfile(profile)).length === 0;
}
