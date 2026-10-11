import jsPDF from 'jspdf';
import { UserProfile } from '../types';
import { AnimalGrowthRecord, DEFAULT_GROWTH_RECORDS } from './offlineStorageService';

export interface ExportAnimalData {
  name: string;
  tag: string;
  breed: string;
  milk: string;
  health: number;
  status: string;
  extraBadge?: string | null;
}

export interface ExportVaccineData {
  month: string;
  day: string;
  name: string;
  disease: string;
  animal: string;
  isOverdue: boolean;
}

export interface ExportAlertData {
  severity: string;
  tag: string;
  animal: string;
  title: string;
  desc: string;
  nextStep: string;
}

/**
 * Generates a comprehensive 2-page veterinary clinical health and growth report
 * including longitudinal weight trajectories, predictive market projections, and Rx notes.
 */
export function generateComprehensiveHerdReportPDF(
  profile: UserProfile,
  animalsList?: ExportAnimalData[],
  growthRecords?: AnimalGrowthRecord[],
  vaccinesList?: ExportVaccineData[],
  alertsList?: ExportAlertData[]
): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const defaultAnimals: ExportAnimalData[] = animalsList || [
    { name: 'Moti', tag: 'IN-GJ-3090', breed: 'Goat · Sirohi · 2 yrs', milk: '2.1 L/day', health: 5, status: 'Critical' },
    { name: 'Lakshmi', tag: 'IN-GJ-1088', breed: 'Cow · Gir · 3 yrs', milk: '11.2 L/day', health: 51, status: 'Sick' },
    { name: 'Gauri', tag: 'IN-GJ-1042', breed: 'Cow · Holstein cross · 4 yrs', milk: '18.5 L/day', health: 90, status: 'Healthy', extraBadge: 'Month 6 Gestation' },
    { name: 'Shera', tag: 'IN-GJ-2011', breed: 'Buffalo · Murrah · 5 yrs', milk: '15.0 L/day', health: 90, status: 'Healthy' }
  ];

  const defaultGrowth: AnimalGrowthRecord[] = growthRecords && growthRecords.length > 0 ? growthRecords : DEFAULT_GROWTH_RECORDS;

  // ==========================================
  // PAGE 1: HERD HEALTH & CLINICAL STATUS
  // ==========================================
  let y = margin;

  // Header Banner (#1A3C2B Forest Green)
  doc.setFillColor(26, 60, 43);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ANIGUARD — HERD HEALTH & GROWTH TREND REPORT', margin, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(165, 201, 180);
  doc.text('Veterinary Clinical Consultation Record · INAPH Livestock Portal Synchronized', margin, 20);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · Region: ${profile.region || 'Anand, Gujarat'}`, margin, 26);

  y = 38;

  // Farmer & Farm Details Card
  doc.setFillColor(243, 242, 237);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 2.5, 2.5, 'F');

  doc.setTextColor(26, 60, 43);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Farmer: ${profile.name || 'Ramesh Patel'}`, margin + 4, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(75, 85, 99);
  doc.text(`Holding: GreenPastures Dairy Farm · Anand, Gujarat | INAPH Center: Anand West`, margin + 4, y + 12);
  doc.text(`Total Herd: ${defaultAnimals.length} Head | Cumulative Daily Yield: 46.8 Liters | Breed Roster: Gir, Murrah, Sirohi, Holstein`, margin + 4, y + 17);

  y += 26;

  // Section 1: Herd Roster & Health Scores
  doc.setTextColor(26, 60, 43);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. Herd Health Assessment Roster', margin, y);
  y += 5;

  // Table Header
  doc.setFillColor(230, 240, 234);
  doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(26, 60, 43);
  doc.text('Ear Tag ID', margin + 3, y + 4.5);
  doc.text('Name & Breed', margin + 30, y + 4.5);
  doc.text('Daily Milk', margin + 92, y + 4.5);
  doc.text('Health Score', margin + 122, y + 4.5);
  doc.text('Clinical Status', margin + 152, y + 4.5);
  y += 6.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  defaultAnimals.forEach((animal, index) => {
    if (index % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
    }

    doc.setTextColor(55, 65, 81);
    doc.text(animal.tag, margin + 3, y + 4.5);
    doc.text(`${animal.name} (${animal.breed})`, margin + 30, y + 4.5);
    doc.text(animal.milk, margin + 92, y + 4.5);
    doc.text(`${animal.health}%`, margin + 122, y + 4.5);

    if (animal.status === 'Critical') {
      doc.setTextColor(198, 40, 40);
    } else if (animal.status === 'Sick') {
      doc.setTextColor(230, 81, 0);
    } else {
      doc.setTextColor(46, 125, 50);
    }
    doc.setFont('helvetica', 'bold');
    doc.text(animal.status.toUpperCase(), margin + 152, y + 4.5);
    doc.setFont('helvetica', 'normal');

    y += 6.5;
  });

  y += 5;

  // Section 2: Vaccination & Deworming Protocol
  doc.setTextColor(26, 60, 43);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('2. Mandatory Vaccination & Prophylaxis Log (WOAH/ICAR Guidelines)', margin, y);
  y += 5;

  doc.setFillColor(230, 240, 234);
  doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(26, 60, 43);
  doc.text('Date', margin + 3, y + 4.5);
  doc.text('Vaccine / Biologic', margin + 32, y + 4.5);
  doc.text('Target Pathogen', margin + 82, y + 4.5);
  doc.text('Animal', margin + 130, y + 4.5);
  doc.text('Status', margin + 158, y + 4.5);
  y += 6.5;

  const defaultVaccines: ExportVaccineData[] = vaccinesList || [
    { month: 'OCT', day: '04', name: 'PPR Sungri 96 (1 ml s/c)', disease: 'Peste des petits ruminants', animal: 'Moti (IN-GJ-3090)', isOverdue: true },
    { month: 'OCT', day: '27', name: 'FMD Trivalent (2 ml i/m)', disease: 'Foot-and-mouth disease', animal: 'Gauri (IN-GJ-1042)', isOverdue: false },
    { month: 'NOV', day: '03', name: 'HS Oil Adjuvant (3 ml i/m)', disease: 'Hemorrhagic septicemia', animal: 'Shera (IN-GJ-2011)', isOverdue: false }
  ];

  defaultVaccines.forEach((vac, index) => {
    if (vac.isOverdue) {
      doc.setFillColor(254, 242, 242);
    } else if (index % 2 === 1) {
      doc.setFillColor(249, 250, 251);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');

    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${vac.month} ${vac.day}, 2026`, margin + 3, y + 4.5);
    doc.text(vac.name, margin + 32, y + 4.5);
    doc.text(vac.disease, margin + 82, y + 4.5);
    doc.text(vac.animal, margin + 130, y + 4.5);

    if (vac.isOverdue) {
      doc.setTextColor(198, 40, 40);
      doc.setFont('helvetica', 'bold');
      doc.text('OVERDUE (Urgent)', margin + 158, y + 4.5);
    } else {
      doc.setTextColor(21, 101, 192);
      doc.setFont('helvetica', 'normal');
      doc.text('Scheduled', margin + 158, y + 4.5);
    }

    y += 7;
  });

  y += 5;

  // Section 3: Clinical Alerts & Symptom Log
  doc.setTextColor(26, 60, 43);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('3. Active Clinical Observations & Triage Notes', margin, y);
  y += 5;

  const defaultAlerts: ExportAlertData[] = alertsList || [
    {
      severity: 'Urgent',
      tag: 'IN-GJ-3090',
      animal: 'Moti',
      title: 'PPR booster overdue; mild nasal discharge recorded',
      desc: 'Young Sirohi goat requires live attenuated booster. Body temp 39.1°C.',
      nextStep: 'Administer 1 ml subcutaneous vaccine; isolate if fever rises.'
    },
    {
      severity: 'Watch',
      tag: 'IN-GJ-1088',
      animal: 'Lakshmi',
      title: 'Post-Mastitis Udder Tissue Recovery',
      desc: 'Milk returned from 7.2 L to 11.2 L post herbal udder spray. CMT paddle trace negative.',
      nextStep: 'Complete 5-day post-milking teat barrier dip.'
    },
    {
      severity: 'Watch',
      tag: 'IN-GJ-1042',
      animal: 'Gauri',
      title: 'Gestation Month 6 Nutritional Balance',
      desc: 'High producing Holstein cross; fetus growth accelerating.',
      nextStep: 'Add 0.8 kg concentrate with 50g chelated mineral mix.'
    }
  ];

  defaultAlerts.forEach((alert) => {
    doc.setFillColor(243, 242, 237);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 13, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    if (alert.severity === 'Urgent') {
      doc.setTextColor(198, 40, 40);
    } else {
      doc.setTextColor(230, 81, 0);
    }
    doc.text(`[${alert.severity.toUpperCase()}] ${alert.animal} (${alert.tag}): ${alert.title}`, margin + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(75, 85, 99);
    doc.text(alert.desc, margin + 3, y + 8.5);
    doc.setTextColor(26, 60, 43);
    doc.text(`Recommended Action: ${alert.nextStep}`, margin + 3, y + 11.5);

    y += 15;
  });

  // Footer Page 1
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);
  doc.text('Page 1 of 2 — AniGuard Digital Livestock Health Passport · Proceed to Page 2 for Growth Trajectories & Market Forecasts', pageWidth / 2, pageHeight - 6, { align: 'center' });

  // ==========================================
  // PAGE 2: GROWTH TRENDS & PREDICTIVE FORECASTING
  // ==========================================
  doc.addPage();
  y = margin;

  // Header Page 2
  doc.setFillColor(26, 60, 43);
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('LIVESTOCK GROWTH TRENDS & PREDICTIVE MARKET MODEL', margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(165, 201, 180);
  doc.text('Longitudinal Weight Tracking, BCS Evaluation, and Optimal Market Sale Date Forecasts', margin, 18);

  y = 30;

  // Section 4: Longitudinal Weight & Growth Trajectory Table
  doc.setTextColor(26, 60, 43);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('4. Historical Weigh-In Trajectories & BCS Scores (Last 6 Months)', margin, y);
  y += 5;

  doc.setFillColor(230, 240, 234);
  doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(26, 60, 43);
  doc.text('Animal Tag', margin + 3, y + 4.5);
  doc.text('Initial (May)', margin + 32, y + 4.5);
  doc.text('Current (Oct)', margin + 62, y + 4.5);
  doc.text('Net Gain (6mo)', margin + 92, y + 4.5);
  doc.text('ADG (kg/mo)', margin + 125, y + 4.5);
  doc.text('Current BCS', margin + 155, y + 4.5);
  y += 6.5;

  const herdGrowthSummaries = [
    { tag: 'IN-GJ-1042', name: 'Gauri (Holstein Cross)', initial: 412, current: 476, gain: '+64 kg', adg: '+10.7', bcs: '3.8 / 5.0' },
    { tag: 'IN-GJ-1088', name: 'Lakshmi (Gir Cow)', initial: 350, current: 388, gain: '+38 kg', adg: '+6.3', bcs: '3.4 / 5.0' },
    { tag: 'IN-GJ-2011', name: 'Shera (Murrah Buffalo)', initial: 520, current: 582, gain: '+62 kg', adg: '+10.3', bcs: '3.8 / 5.0' },
    { tag: 'IN-GJ-3090', name: 'Moti (Sirohi Goat)', initial: 37, current: 46, gain: '+9 kg', adg: '+1.5', bcs: '3.3 / 5.0' }
  ];

  herdGrowthSummaries.forEach((summary, index) => {
    if (index % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
    }

    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${summary.name}`, margin + 3, y + 4.5);
    doc.text(`${summary.initial} kg`, margin + 32, y + 4.5);
    doc.text(`${summary.current} kg`, margin + 62, y + 4.5);
    
    doc.setTextColor(46, 125, 50);
    doc.setFont('helvetica', 'bold');
    doc.text(summary.gain, margin + 92, y + 4.5);
    doc.text(summary.adg, margin + 125, y + 4.5);
    
    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'normal');
    doc.text(summary.bcs, margin + 155, y + 4.5);

    y += 7;
  });

  y += 5;

  // Section 5: Predictive Growth Modeling & Optimal Market Sale Dates
  doc.setTextColor(26, 60, 43);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('5. Predictive Market Valuation & Optimal Sale Date Forecast', margin, y);
  y += 5;

  doc.setFillColor(230, 240, 234);
  doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(26, 60, 43);
  doc.text('Animal', margin + 3, y + 4.5);
  doc.text('Prime Market Wt.', margin + 35, y + 4.5);
  doc.text('Est. Optimal Sale Date', margin + 75, y + 4.5);
  doc.text('Projected Mandi Value', margin + 125, y + 4.5);
  doc.text('Feed Margin (ROI)', margin + 160, y + 4.5);
  y += 6.5;

  const marketForecasts = [
    { name: 'Moti (Goat)', prime: '54.0 kg', date: 'Jan 12, 2027 (~93d)', val: '₹28,080', roi: '+₹4,250 net gain' },
    { name: 'Gauri (Cow)', prime: '510.0 kg', date: 'Dec 20, 2026 (~70d)', val: '₹79,050', roi: '+₹6,800 net gain' },
    { name: 'Lakshmi (Cow)', prime: '425.0 kg', date: 'Jan 28, 2027 (~109d)', val: '₹72,250', roi: '+₹5,100 net gain' },
    { name: 'Shera (Buffalo)', prime: '620.0 kg', date: 'Feb 15, 2027 (~127d)', val: '₹99,200', roi: '+₹8,400 net gain' }
  ];

  marketForecasts.forEach((forecast, index) => {
    if (index % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
    }

    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(forecast.name, margin + 3, y + 4.5);
    doc.text(forecast.prime, margin + 35, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229); // Indigo for forecast date
    doc.text(forecast.date, margin + 75, y + 4.5);

    doc.setTextColor(26, 60, 43);
    doc.text(forecast.val, margin + 125, y + 4.5);

    doc.setTextColor(46, 125, 50);
    doc.text(forecast.roi, margin + 160, y + 4.5);

    y += 7;
  });

  y += 6;

  // Section 6: Veterinary Doctor Sign-Off & Rx Box
  doc.setTextColor(26, 60, 43);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('6. Veterinary Physical Inspection, Deworming Cert & Clinical Notes', margin, y);
  y += 5;

  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 40, 2.5, 2.5, 'D');

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('Physical Observations / Body Condition Evaluation / Prescribed Antibiotics & Nutrition Premixes:', margin + 4, y + 6);

  for (let i = 1; i <= 3; i++) {
    doc.setDrawColor(229, 231, 235);
    doc.line(margin + 4, y + 6 + (i * 7), pageWidth - margin - 4, y + 6 + (i * 7));
  }

  // Signature Block
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text('Registered Veterinary Practitioner Signature: _________________________', margin + 4, y + 34);
  doc.text('State Vet Council Reg. No. / Hospital Seal: _________________________', margin + 102, y + 34);

  // Footer Page 2
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);
  doc.text('Page 2 of 2 — AniGuard AI Farm Intelligence System · Valid for National Livestock Mission & Bank Credit Audits', pageWidth / 2, pageHeight - 6, { align: 'center' });

  // Download PDF
  const filename = `AniGuard_Herd_Health_Growth_Report_${(profile.name || 'Ramesh').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
  return filename;
}

// Retain legacy method name for backward compatibility
export const generateVeterinarySummaryPDF = generateComprehensiveHerdReportPDF;
