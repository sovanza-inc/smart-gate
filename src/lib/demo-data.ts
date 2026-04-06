import { Worker } from "@/types";
import { generateId, formatDate, generateIrisId, initials, makeFaceCanvas, randomColor } from "./utils";

export function createDemoWorkers(existingWorkers: Worker[]): Worker[] {
  const demos = [
    { name: "Mohammed Al-Ghamdi", iqama: "2345678901", contractor: "Al-Rashid Construction", job: "Electrician", phone: "0512345678", days: 7, nat: "Egyptian" },
    { name: "Saif Ali Khan", iqama: "2456789012", contractor: "Advanced Construction Co.", job: "Welder", phone: "0523456789", days: 14, nat: "Indian" },
    { name: "Ahmed Hassan Ibrahim", iqama: "2567890123", contractor: "Gulf Contracting Group", job: "Site Supervisor", phone: "0534567890", days: 30, nat: "Egyptian" },
    { name: "Raj Kumar Singh", iqama: "2678901234", contractor: "Al-Rashid Construction", job: "Mason", phone: "0545678901", days: 3, nat: "Indian" },
    { name: "Omar Abdullah Nasser", iqama: "2789012345", contractor: "Advanced Construction Co.", job: "Safety Officer", phone: "0556789012", days: 30, nat: "Pakistani" },
    { name: "Juan Dela Cruz", iqama: "2890123456", contractor: "Gulf Contracting Group", job: "Scaffolder", phone: "0567890123", days: 1, nat: "Filipino" },
    { name: "Hasan Rahman", iqama: "2901234567", contractor: "Al-Rashid Construction", job: "Pipefitter", phone: "0578901234", days: 60, nat: "Bangladeshi" },
  ];

  const newWorkers: Worker[] = [];

  for (const d of demos) {
    if (existingWorkers.find((x) => x.iqama === d.iqama)) continue;
    const exp = new Date();
    exp.setDate(exp.getDate() + d.days);
    newWorkers.push({
      id: generateId(),
      name: d.name,
      iqama: d.iqama,
      contractor: d.contractor,
      job: d.job,
      phone: d.phone,
      nationality: d.nat,
      expiryRaw: exp.toISOString(),
      expiryDisplay: formatDate(exp.toISOString()),
      digits: d.iqama.slice(-5),
      status: "outside",
      lastEntry: null,
      facePhoto: makeFaceCanvas(initials(d.name), randomColor()),
      eyePhoto: null,
      eyeId: generateIrisId(),
      telegram: "",
      createdAt: new Date().toLocaleString("en-US"),
    });
  }

  return newWorkers;
}

export const JOB_OPTIONS = [
  { group: "Electrical", jobs: ["Electrician", "Electrical Technician", "Instrumentation Technician", "Cable Puller"] },
  { group: "Mechanical", jobs: ["Mechanical Technician", "Pipefitter", "Welder", "Rigger", "Millwright"] },
  { group: "Civil", jobs: ["Civil Engineer", "Mason", "Carpenter", "Steel Fixer", "Scaffolder", "Concrete Worker"] },
  { group: "Operations", jobs: ["Heavy Equipment Operator", "Crane Operator", "Forklift Operator", "Driver"] },
  { group: "General", jobs: ["General Laborer", "Foreman", "Site Supervisor", "Safety Officer", "QC Inspector"] },
];

export const NATIONALITIES = [
  "Indian", "Pakistani", "Bangladeshi", "Filipino", "Nepali",
  "Egyptian", "Yemeni", "Sudanese", "Ethiopian", "Sri Lankan",
  "Indonesian", "Jordanian", "Syrian", "Lebanese", "Turkish", "Other",
];
