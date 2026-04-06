export interface Worker {
  id: string;
  name: string;
  iqama: string;
  contractor: string;
  job: string;
  phone: string;
  nationality: string;
  expiryRaw: string;
  expiryDisplay: string;
  digits: string;
  status: "inside" | "outside";
  lastEntry: string | null;
  facePhoto: string | null;
  eyePhoto: string | null;
  eyeId: string;
  telegram: string;
  createdAt: string;
}

export interface LogEntry {
  workerId: string;
  name: string;
  job: string;
  contractor: string;
  nationality: string;
  facePhoto: string | null;
  type: "in" | "out";
  time: string;
  date: string;
  speed: number;
}

export type Lang = "en" | "ar";
