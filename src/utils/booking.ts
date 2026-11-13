import type { Appointment, BookingCatalog, BookingSlots, BookingDoctor, TimeSlot } from "@/services/appointmentApi";

export type ClinicDoctor = Pick<BookingDoctor, "id" | "name" | "specialty" | "bio">;
export type BookedAppointment = Appointment;
export type { BookingCatalog, BookingSlots, TimeSlot };
