import { DriverProfile } from "@/types/DriverProfile";

export type DriverProfileValidationErrors = Partial<
  Record<keyof DriverProfile, string>
>;

const NAME_REGEX = /^[A-Za-z\u0400-\u04FF\s'-]{2,}$/;
const PHONE_REGEX = /^(\+976)?\d{8}$/;
const CAR_PLATE_REGEX = /^\d{4}\s?[A-Z\u0400-\u04FF]{3}$/;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizePhone(value: string): string {
  return value.replace(/[\s()-]/g, "");
}

export function validateDriverProfile(
  profile: DriverProfile,
): DriverProfileValidationErrors {
  const errors: DriverProfileValidationErrors = {};

  const lastName = asString(profile.lastName).trim();
  const firstName = asString(profile.firstName).trim();
  const phone = asString(profile.phone).trim();
  const carPlate = asString(profile.carPlate).trim().toUpperCase();
  const company = asString(profile.company).trim();

  if (!NAME_REGEX.test(lastName)) {
    errors.lastName = "Овог 2+ үсэгтэй байх ёстой.";
  }

  if (!NAME_REGEX.test(firstName)) {
    errors.firstName = "Нэр 2+ үсэгтэй байх ёстой.";
  }

  const normalizedPhone = normalizePhone(phone);
  if (!PHONE_REGEX.test(normalizedPhone)) {
    errors.phone = "Утасны дугаар 8 оронтой байх ёстой.";
  }

  if (!CAR_PLATE_REGEX.test(carPlate)) {
    errors.carPlate = "Дугаар: 1234 УБА гэсэн дараалалтай оруулна уу.";
  }

  if (!company) {
    errors.company = "Компани сонгоно уу.";
  }

  return errors;
}

export function isDriverProfileValid(profile: DriverProfile): boolean {
  return Object.keys(validateDriverProfile(profile)).length === 0;
}
