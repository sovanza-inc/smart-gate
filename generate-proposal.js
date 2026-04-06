const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageBreak, PageNumber, LevelFormat,
} = require("docx");

const BLUE = "1B4F72";
const LIGHT_BLUE = "D5E8F0";
const DARK_BLUE = "154360";
const GREEN = "1E8449";
const WHITE = "FFFFFF";
const GRAY = "F2F3F4";
const BORDER_COLOR = "BDC3C7";

const border = { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

const TABLE_WIDTH = 9360;

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, children: [new TextRun(text)] });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    alignment: opts.align || AlignmentType.LEFT,
    children: [new TextRun({ text, size: opts.size || 22, font: "Arial", bold: opts.bold, color: opts.color })],
  });
}

function spacer() {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

function headerCell(text, width) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: { fill: BLUE, type: ShadingType.CLEAR },
    margins: cellMargins,
    verticalAlign: "center",
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, color: WHITE, size: 20, font: "Arial" })] })],
  });
}

function dataCell(text, width, opts = {}) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: opts.shade ? { fill: GRAY, type: ShadingType.CLEAR } : undefined,
    margins: cellMargins,
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      children: [new TextRun({ text: String(text), size: 20, font: "Arial", bold: opts.bold, color: opts.color })],
    })],
  });
}

function makeTable(headers, rows, colWidths) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({ children: headers.map((h, i) => headerCell(h, colWidths[i])) }),
      ...rows.map((row, ri) =>
        new TableRow({
          children: row.map((cell, ci) =>
            dataCell(cell, colWidths[ci], { shade: ri % 2 === 1, bold: ci === 0 })
          ),
        })
      ),
    ],
  });
}

// =========== BUILD DOCUMENT ===========

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: DARK_BLUE },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  sections: [
    // ============ COVER PAGE ============
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        spacer(), spacer(), spacer(), spacer(), spacer(), spacer(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 8 } },
          children: [new TextRun({ text: "Smart Gate System", size: 56, bold: true, font: "Arial", color: BLUE })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "\u0646\u0638\u0627\u0645 \u0627\u0644\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u0630\u0643\u064A\u0629", size: 44, bold: true, font: "Arial", color: DARK_BLUE })],
        }),
        spacer(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "Comprehensive Proposal", size: 32, font: "Arial", color: BLUE })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "\u0645\u0642\u062A\u0631\u062D \u0634\u0627\u0645\u0644", size: 30, font: "Arial", color: DARK_BLUE })],
        }),
        spacer(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: "Worker Identity Verification & Gate Management System", size: 24, font: "Arial", color: "555555" })],
        }),
        spacer(), spacer(), spacer(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 3, color: BLUE, space: 8 } },
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "Saudi Aramco \u2014 Industrial Security Division", size: 24, font: "Arial", color: BLUE, bold: true })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "March 2026", size: 22, font: "Arial", color: "888888" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 40 },
          children: [new TextRun({ text: "CONFIDENTIAL", size: 20, font: "Arial", color: "CC0000", bold: true })],
        }),
      ],
    },
    // ============ MAIN CONTENT ============
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: BLUE, space: 4 } },
            children: [
              new TextRun({ text: "Smart Gate System \u2014 Proposal", size: 18, font: "Arial", color: BLUE, italics: true }),
            ],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR, space: 4 } },
            children: [
              new TextRun({ text: "Saudi Aramco \u2014 Confidential  |  Page ", size: 16, font: "Arial", color: "888888" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: "888888" }),
            ],
          })],
        }),
      },
      children: [
        // ---- EXECUTIVE SUMMARY ----
        heading("1. Executive Summary"),
        para("The Smart Gate System is a comprehensive digital solution designed to replace the current manual, paper-based worker verification process at industrial gate checkpoints. This system addresses critical bottlenecks in daily operations where 700+ temporary contract workers must be verified individually by security personnel."),
        para("Currently, security guards manually match worker names and residency (Iqama) numbers from paper access forms against a website database \u2014 a process that averages 45 seconds per worker, with no photo verification, no real-time tracking, and significant security vulnerabilities."),
        para("The proposed Smart Gate System provides a three-tier digital verification process using iPad devices: QR code scanning, face photo matching, and Iqama digit confirmation. The system reduces verification time to 3\u20135 seconds per worker (90% improvement), provides real-time tracking of all personnel on-site, and eliminates the security gaps inherent in the current paper-based system."),
        spacer(),
        heading("\u0627\u0644\u0645\u0644\u062E\u0635 \u0627\u0644\u062A\u0646\u0641\u064A\u0630\u064A", HeadingLevel.HEADING_2),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 120 },
          children: [new TextRun({ text: "\u0646\u0638\u0627\u0645 \u0627\u0644\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u0630\u0643\u064A\u0629 \u0647\u0648 \u062D\u0644 \u0631\u0642\u0645\u064A \u0634\u0627\u0645\u0644 \u0645\u0635\u0645\u0645 \u0644\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u064A\u062F\u0648\u064A\u0629 \u0627\u0644\u0648\u0631\u0642\u064A\u0629 \u0639\u0646\u062F \u0646\u0642\u0627\u0637 \u0627\u0644\u062A\u0641\u062A\u064A\u0634 \u0627\u0644\u0635\u0646\u0627\u0639\u064A\u0629. \u064A\u0639\u0627\u0644\u062C \u0647\u0630\u0627 \u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u0627\u062E\u062A\u0646\u0627\u0642\u0627\u062A \u0627\u0644\u062D\u0631\u062C\u0629 \u0641\u064A \u0627\u0644\u0639\u0645\u0644\u064A\u0627\u062A \u0627\u0644\u064A\u0648\u0645\u064A\u0629 \u062D\u064A\u062B \u064A\u062C\u0628 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0623\u0643\u062B\u0631 \u0645\u0646 700 \u0639\u0627\u0645\u0644 \u0645\u0624\u0642\u062A \u064A\u0648\u0645\u064A\u0627\u064B.", size: 22, font: "Arial" })],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 120 },
          children: [new TextRun({ text: "\u064A\u0648\u0641\u0631 \u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u0645\u0642\u062A\u0631\u062D \u0639\u0645\u0644\u064A\u0629 \u062A\u062D\u0642\u0642 \u0631\u0642\u0645\u064A\u0629 \u062B\u0644\u0627\u062B\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u0648\u064A\u0627\u062A \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0623\u062C\u0647\u0632\u0629 iPad: \u0645\u0633\u062D \u0631\u0645\u0632 QR\u060C \u0648\u0645\u0637\u0627\u0628\u0642\u0629 \u0635\u0648\u0631\u0629 \u0627\u0644\u0648\u062C\u0647\u060C \u0648\u062A\u0623\u0643\u064A\u062F \u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0625\u0642\u0627\u0645\u0629. \u064A\u0642\u0644\u0644 \u0627\u0644\u0646\u0638\u0627\u0645 \u0648\u0642\u062A \u0627\u0644\u062A\u062D\u0642\u0642 \u0625\u0644\u0649 3-5 \u062B\u0648\u0627\u0646\u064D \u0644\u0643\u0644 \u0639\u0627\u0645\u0644 (\u062A\u062D\u0633\u064A\u0646 \u0628\u0646\u0633\u0628\u0629 90%).", size: 22, font: "Arial" })],
        }),

        // ---- PROBLEM STATEMENT ----
        new Paragraph({ children: [new PageBreak()] }),
        heading("2. Problem Statement"),
        heading("2.1 Current Process", HeadingLevel.HEADING_2),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          children: [new TextRun({ text: "Every 10\u201320 workers share a single paper access form containing names and Iqama numbers", size: 22, font: "Arial" })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          children: [new TextRun({ text: "Security guard manually reads each name and Iqama number from a website \u2014 one by one", size: 22, font: "Arial" })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          children: [new TextRun({ text: "No photographs available for identity verification", size: 22, font: "Arial" })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          children: [new TextRun({ text: "Existing facial recognition system only applies to Aramco cardholders \u2014 temporary workers excluded", size: 22, font: "Arial" })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          children: [new TextRun({ text: "No real-time tracking of who is currently inside the facility", size: 22, font: "Arial" })],
        }),
        spacer(),
        heading("2.2 Impact Analysis", HeadingLevel.HEADING_2),
        makeTable(
          ["Metric", "Current Impact"],
          [
            ["Average verification time per worker", "45 seconds"],
            ["Morning entry time (700 workers)", "8.75 hours (525 minutes)"],
            ["Security guards required per gate", "5\u20136 guards"],
            ["Estimated error rate", "~15% (expired/mismatched entries)"],
            ["Photo verification", "None \u2014 identity cannot be confirmed visually"],
            ["Real-time tracking", "None \u2014 no record of who is inside"],
            ["Worker wait time at gate", "30\u201360 minutes during peak"],
          ],
          [4680, 4680]
        ),

        // ---- PROPOSED SOLUTION ----
        new Paragraph({ children: [new PageBreak()] }),
        heading("3. Proposed Solution"),
        para("The Smart Gate System introduces a three-tier digital verification process that transforms gate security operations:"),
        spacer(),
        heading("3.1 Three-Tier Verification", HeadingLevel.HEADING_2),
        makeTable(
          ["Tier", "Method", "Purpose"],
          [
            ["Tier 1", "QR Code Scan", "Instant worker identification \u2014 scan unique QR code on worker\u2019s phone or badge"],
            ["Tier 2", "Face Photo Match", "Visual identity confirmation \u2014 guard compares live person with registered photo"],
            ["Tier 3", "Iqama Digit Verification", "Document validation \u2014 worker confirms last 5 digits of Iqama number"],
          ],
          [1500, 2500, 5360]
        ),
        spacer(),
        heading("3.2 Key Capabilities", HeadingLevel.HEADING_2),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "iPad-based system at every security gate checkpoint", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "4-step worker registration: Info \u2192 Face Photo \u2192 Iris Scan \u2192 QR Code", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Real-time dashboard showing all workers currently inside the facility", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Batch processing mode for fast sequential entry during peak hours", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "WhatsApp integration to send QR passes directly to workers\u2019 phones", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Bilingual Arabic/English interface", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Speed measurement analytics comparing manual vs. automated verification", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Automatic alerts for expiring or expired worker credentials", size: 22, font: "Arial" })] }),

        // ---- SYSTEM ARCHITECTURE ----
        new Paragraph({ children: [new PageBreak()] }),
        heading("4. System Architecture"),
        makeTable(
          ["Component", "Technology", "Description"],
          [
            ["Frontend", "Next.js (React, TypeScript)", "Modern web application optimized for iPad Safari and PWA deployment"],
            ["Styling", "Tailwind CSS", "Responsive design system with dark/light mode support"],
            ["Storage (Prototype)", "LocalStorage / IndexedDB", "Client-side storage for offline capability and demo purposes"],
            ["Storage (Production)", "PostgreSQL + Redis", "Server-side database with caching for enterprise deployment"],
            ["QR Code", "qrcode.react + jsQR", "Generation and real-time camera scanning of unique worker QR codes"],
            ["Biometrics", "Camera API + face-api.js", "Face photo capture; iris scan simulation (integration-ready for hardware)"],
            ["Communication", "WhatsApp Business API", "Automated distribution of QR passes to worker mobile phones"],
            ["Deployment", "Vercel / On-premise", "Cloud or on-premise hosting with HTTPS for camera access"],
          ],
          [2000, 2680, 4680]
        ),

        // ---- FEATURES ----
        new Paragraph({ children: [new PageBreak()] }),
        heading("5. Features & Capabilities"),
        makeTable(
          ["Feature", "Description", "Status"],
          [
            ["Worker Registration", "4-step wizard: personal info, face photo, iris scan, QR code generation", "Ready"],
            ["QR Code Generation", "Unique QR per worker; downloadable PNG, printable badge, WhatsApp sharing", "Ready"],
            ["Security Gate Verification", "Three-tier check: QR scan + face match + Iqama digits", "Ready"],
            ["Face Photo Matching", "Camera capture of worker photo; side-by-side comparison at gate", "Ready"],
            ["Iris Biometric", "Simulated iris scan with unique ID; ready for hardware integration", "Prototype"],
            ["Batch Entry Mode", "Auto-continue after each verification for fast group processing", "Ready"],
            ["Real-time Tracking", "Live count of workers inside facility; entry/exit logging", "Ready"],
            ["Speed Measurement", "Per-verification timer; average speed calculation; manual vs. auto comparison", "Ready"],
            ["CSV Export", "Download daily gate logs as CSV for reporting and audit", "Ready"],
            ["Printable Badges", "Generate printable worker badges with QR code, photo, and details", "Ready"],
            ["Contractor Dashboard", "Summary statistics grouped by contractor company", "Ready"],
            ["Nationality Stats", "Worker count breakdown by nationality with percentage bars", "Ready"],
            ["Expiry Alerts", "Prominent warnings for expired and soon-to-expire worker credentials", "Ready"],
            ["Arabic/English UI", "Full bilingual interface toggle; RTL layout support", "Ready"],
            ["Offline Capable", "LocalStorage persistence; works without internet after initial load", "Ready"],
          ],
          [2200, 5360, 1800]
        ),

        // ---- IMPLEMENTATION PHASES ----
        new Paragraph({ children: [new PageBreak()] }),
        heading("6. Implementation Phases"),
        heading("Phase 1: Pilot (Month 1)", HeadingLevel.HEADING_2),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Deploy prototype on 2 iPads at a single gate", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Register and test with 50 workers from 2\u20133 contractor companies", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Measure actual speed improvement vs. manual process", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Gather feedback from security guards and workers", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Refine UI and workflow based on real-world usage", size: 22, font: "Arial" })] }),
        spacer(),
        heading("Phase 2: Full Deployment (Month 2)", HeadingLevel.HEADING_2),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Deploy to all security gates with dedicated iPads", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Register all 700+ workers with photos and QR codes", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Train all security staff on the new system", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Set up server-side database for centralized data", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Integrate with existing contractor management workflows", size: 22, font: "Arial" })] }),
        spacer(),
        heading("Phase 3: Integration (Month 3)", HeadingLevel.HEADING_2),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Connect to Aramco identity management systems", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Implement AI-powered facial recognition for automated matching", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Add turnstile/gate hardware integration for automated entry", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Deploy analytics dashboard for management reporting", size: 22, font: "Arial" })] }),

        // ---- SPEED ANALYSIS ----
        new Paragraph({ children: [new PageBreak()] }),
        heading("7. Speed Analysis"),
        para("The most critical improvement of the Smart Gate System is the dramatic reduction in verification time. The following comparison is based on observed manual process timing and prototype testing:"),
        spacer(),
        makeTable(
          ["Metric", "Manual Process", "Smart Gate", "Improvement"],
          [
            ["Per-worker verification", "45 seconds", "3\u20135 seconds", "90% faster"],
            ["Morning entry (700 workers)", "8.75 hours", "~58 minutes", "87% reduction"],
            ["Security guards needed", "5\u20136 guards", "2\u20133 guards", "50% reduction"],
            ["Error rate (false entries)", "~15%", "<1%", "93% improvement"],
            ["Real-time tracking", "Not available", "Full tracking", "New capability"],
            ["Photo verification", "Not available", "Every entry", "New capability"],
            ["Daily time savings", "\u2014", "7+ hours", "Significant"],
          ],
          [2340, 2340, 2340, 2340]
        ),

        // ---- HARDWARE ----
        spacer(), spacer(),
        heading("8. Hardware Requirements"),
        makeTable(
          ["Item", "Specification", "Quantity", "Est. Cost (SAR)"],
          [
            ["iPad Pro 11\u201D or iPad Air", "Latest generation, 64GB+", "2\u20133 per gate", "2,500\u20134,000 each"],
            ["iPad Stand/Mount", "Secure booth-mounted stand", "1 per iPad", "200\u2013400 each"],
            ["Protective Case", "Industrial-grade, anti-theft", "1 per iPad", "150\u2013300 each"],
            ["WiFi Access Point", "Industrial-grade, outdoor rated", "1 per gate area", "500\u20131,000 each"],
            ["QR Code Printer (optional)", "Thermal label printer", "1 per registration desk", "800\u20131,500 each"],
            ["Backup Power", "UPS / Power bank", "1 per gate", "300\u2013500 each"],
          ],
          [2340, 2700, 1800, 2520]
        ),
        spacer(),
        para("Estimated hardware cost per gate: SAR 5,000 \u2013 8,000", { bold: true, color: BLUE }),

        // ---- TIMELINE ----
        new Paragraph({ children: [new PageBreak()] }),
        heading("9. Implementation Timeline"),
        makeTable(
          ["Week", "Phase 1: Pilot", "Phase 2: Deployment", "Phase 3: Integration"],
          [
            ["Week 1\u20132", "System setup, gate installation", "\u2014", "\u2014"],
            ["Week 3\u20134", "50-worker pilot, speed testing", "Staff training begins", "\u2014"],
            ["Week 5\u20136", "Feedback & refinement", "All-gate deployment", "\u2014"],
            ["Week 7\u20138", "\u2014", "Full 700+ worker registration", "API integration planning"],
            ["Week 9\u201310", "\u2014", "System monitoring & tuning", "Aramco system connection"],
            ["Week 11\u201312", "\u2014", "\u2014", "AI facial recognition, turnstile integration"],
          ],
          [1500, 2620, 2620, 2620]
        ),

        // ---- COST ESTIMATION ----
        spacer(), spacer(),
        heading("10. Cost Estimation"),
        makeTable(
          ["Category", "Description", "Estimated Cost (SAR)"],
          [
            ["Hardware", "iPads, stands, cases, networking (3 gates)", "15,000 \u2013 25,000"],
            ["Software Development", "Custom development, testing, deployment", "50,000 \u2013 80,000"],
            ["Training", "Security staff training (2 sessions)", "5,000"],
            ["Annual Maintenance", "Updates, support, hosting", "15,000 / year"],
            ["Total Year 1", "Complete system implementation", "85,000 \u2013 125,000"],
          ],
          [2500, 4360, 2500]
        ),

        // ---- ROI ANALYSIS ----
        new Paragraph({ children: [new PageBreak()] }),
        heading("11. Return on Investment (ROI)"),
        makeTable(
          ["Benefit", "Annual Value"],
          [
            ["Time savings: 7+ hours daily \u00D7 365 days = 2,555 hours", "Significant operational efficiency"],
            ["Reduced security staff: 2\u20133 fewer guards per gate", "SAR 60,000 \u2013 100,000 savings"],
            ["Reduced security incidents & false entries", "Risk mitigation (priceless)"],
            ["Real-time workforce tracking & reporting", "Management visibility"],
            ["Contractor accountability & compliance", "Regulatory compliance"],
            ["Worker satisfaction: reduced wait times", "Improved morale & productivity"],
          ],
          [5680, 3680]
        ),
        spacer(),
        para("Estimated payback period: 6 \u2013 12 months", { bold: true, color: GREEN, size: 24 }),

        // ---- RISK ASSESSMENT ----
        spacer(),
        heading("12. Risk Assessment & Mitigation"),
        makeTable(
          ["Risk", "Impact", "Likelihood", "Mitigation"],
          [
            ["Camera failure", "Medium", "Low", "Manual search fallback mode; spare devices"],
            ["WiFi interruption", "Medium", "Low", "Offline mode with local storage; 4G backup"],
            ["Worker resistance to new system", "Low", "Medium", "WhatsApp notifications; simple QR-based process"],
            ["Device damage/theft", "Medium", "Low", "Industrial cases; secure mounts; insurance"],
            ["Data privacy concerns", "High", "Low", "Local-only storage; encrypted data; access controls"],
            ["Power failure", "Medium", "Low", "UPS backup; battery-powered iPads"],
            ["System downtime", "High", "Very Low", "Paper-based fallback; redundant devices"],
          ],
          [1800, 1400, 1400, 4760]
        ),

        // ---- APPENDIX ----
        new Paragraph({ children: [new PageBreak()] }),
        heading("13. Appendix"),
        heading("A. Technical Specifications", HeadingLevel.HEADING_2),
        makeTable(
          ["Specification", "Detail"],
          [
            ["Frontend Framework", "Next.js 15 (React 18, TypeScript)"],
            ["Styling", "Tailwind CSS 3 with custom design system"],
            ["QR Code Library", "qrcode.react (generation), jsQR (scanning)"],
            ["Storage (Prototype)", "Browser LocalStorage"],
            ["Storage (Production)", "PostgreSQL with Prisma ORM"],
            ["Camera API", "WebRTC MediaDevices API"],
            ["Supported Browsers", "Safari (iPad), Chrome, Edge, Firefox"],
            ["Minimum iPad", "iPad Air 4th gen or newer (A14 chip+)"],
            ["Network", "HTTPS required for camera access"],
            ["Languages", "English, Arabic (RTL support)"],
          ],
          [3000, 6360]
        ),
        spacer(),
        heading("B. System Screenshots", HeadingLevel.HEADING_2),
        para("The working prototype is available for live demonstration. Key screens include:"),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Contractor Page: Worker registration wizard (4 steps), registered workers list, contractor summary", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Security Page: QR scanner, worker search, verification card with face photo, entry/exit logging, speed timer", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Statistics Page: Summary, detailed log, contractor breakdown, nationality analysis, speed comparison", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "QR Modal: Worker badge with QR code, Iqama digits, print and WhatsApp sharing options", size: 22, font: "Arial" })] }),
        spacer(),
        heading("C. Contact", HeadingLevel.HEADING_2),
        para("For questions or to schedule a live demonstration of the Smart Gate System prototype, please contact the project team through the Industrial Security Division."),
        spacer(), spacer(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 3, color: BLUE, space: 8 } },
          spacing: { before: 300 },
          children: [new TextRun({ text: "End of Proposal", size: 20, font: "Arial", color: "888888", italics: true })],
        }),
      ],
    },
  ],
});

// Generate file
const outputPath = "C:\\Users\\PC\\Desktop\\Nawaf\\smart-gate\\Smart_Gate_Proposal.docx";
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log("Proposal generated: " + outputPath);
});
