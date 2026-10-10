import jsPDF from 'jspdf';
import { UserProfile } from '../types';

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

export function generateVeterinarySummaryPDF(
  profile: UserProfile,
  animalsList?: ExportAnimalData[],
  vaccinesList?: ExportVaccineData[],
  alertsList?: ExportAlertData[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  // 1. Header Banner (Forest Green #1A3C2B)
  doc.setFillColor(26, 60, 43); // #1A3C2B
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Title in White
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('ANIGUARD — LIVESTOCK HEALTH & VACCINE RECORD', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(165, 201, 180); // #A5C9B4
  doc.text('Veterinary Visit & Clinical Consultation Summary · Ministry of Fisheries, Animal Husbandry & Dairying (INAPH Compatible)', margin, 21);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, margin, 27);

  y = 40;

  // 2. Farm & Farmer Identification Card
  doc.setFillColor(243, 242, 237); // Warm background #F3F2ED
  doc.roundedRect(margin, y, pageWidth - margin * 2, 24, 3, 3, 'F');

  doc.setTextColor(26, 60, 43);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Farmer: ${profile.name || 'Ramesh Patel'}`, margin + 5, y + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(75, 85, 99);
  doc.text(`Farm: GreenPastures Dairy Farm · Anand, Gujarat`, margin + 5, y + 14);
  doc.text(`Herd Size: 4 Animals · Daily Milk Yield: 46.8 L · INAPH Sub-center: Anand West`, margin + 5, y + 19);

  y += 32;

  // 3. Section: Current Herd Health Status
  doc.setTextColor(26, 60, 43);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('1. Herd Roster & Health Status', margin, y);
  y += 6;

  // Table Header
  doc.setFillColor(230, 240, 234);
  doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(26, 60, 43);
  doc.text('Tag ID', margin + 3, y + 5);
  doc.text('Animal & Breed', margin + 32, y + 5);
  doc.text('Yield (L/d)', margin + 90, y + 5);
  doc.text('Health Score', margin + 120, y + 5);
  doc.text('Clinical Status', margin + 152, y + 5);
  y += 7;

  const defaultAnimals: ExportAnimalData[] = animalsList || [
    { name: 'Moti', tag: 'IN-GJ-3090', breed: 'Goat · Sirohi · 2 yrs', milk: '2.1 L/day', health: 5, status: 'Critical' },
    { name: 'Lakshmi', tag: 'IN-GJ-1088', breed: 'Cow · Gir · 3 yrs', milk: '11.2 L/day', health: 51, status: 'Sick' },
    { name: 'Gauri', tag: 'IN-GJ-1042', breed: 'Cow · Holstein cross · 4 yrs', milk: '18.5 L/day', health: 90, status: 'Healthy', extraBadge: 'Month 6 Gestation' },
    { name: 'Shera', tag: 'IN-GJ-2011', breed: 'Buffalo · Murrah · 5 yrs', milk: '15.0 L/day', health: 90, status: 'Healthy' }
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  defaultAnimals.forEach((animal, index) => {
    if (index % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
    }

    doc.setTextColor(55, 65, 81);
    doc.text(animal.tag, margin + 3, y + 5);
    doc.text(`${animal.name} (${animal.breed})`, margin + 32, y + 5);
    doc.text(animal.milk, margin + 90, y + 5);
    
    // Health score colored
    doc.text(`${animal.health}%`, margin + 120, y + 5);

    // Status Pill representation
    if (animal.status === 'Critical') {
      doc.setTextColor(198, 40, 40);
    } else if (animal.status === 'Sick') {
      doc.setTextColor(230, 81, 0);
    } else {
      doc.setTextColor(46, 125, 50);
    }
    doc.setFont('helvetica', 'bold');
    doc.text(animal.status.toUpperCase(), margin + 152, y + 5);
    doc.setFont('helvetica', 'normal');

    y += 7;
  });

  y += 6;

  // 4. Section: Vaccination & Deworming History (Crucial for Vets)
  doc.setTextColor(26, 60, 43);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('2. Vaccination & Medication Schedule (ICAR/WOAH Standards)', margin, y);
  y += 6;

  // Table Header
  doc.setFillColor(230, 240, 234);
  doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(26, 60, 43);
  doc.text('Schedule Date', margin + 3, y + 5);
  doc.text('Vaccine / Drug', margin + 35, y + 5);
  doc.text('Disease Target', margin + 82, y + 5);
  doc.text('Target Animal', margin + 130, y + 5);
  doc.text('Status', margin + 160, y + 5);
  y += 7;

  const defaultVaccines: ExportVaccineData[] = vaccinesList || [
    { month: 'OCT', day: '04', name: 'PPR Sungri 96 (1 ml s/c)', disease: 'Peste des petits ruminants', animal: 'Moti (IN-GJ-3090)', isOverdue: true },
    { month: 'OCT', day: '27', name: 'FMD Trivalent (2 ml i/m)', disease: 'Foot-and-mouth disease', animal: 'Gauri (IN-GJ-1042)', isOverdue: false },
    { month: 'NOV', day: '03', name: 'HS Oil Adjuvant (3 ml i/m)', disease: 'Hemorrhagic septicemia', animal: 'Shera (IN-GJ-2011)', isOverdue: false }
  ];

  defaultVaccines.forEach((vac, index) => {
    if (vac.isOverdue) {
      doc.setFillColor(254, 242, 242); // Red tint for overdue
    } else if (index % 2 === 1) {
      doc.setFillColor(249, 250, 251);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(margin, y, pageWidth - margin * 2, 7.5, 'F');

    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'normal');
    doc.text(`${vac.month} ${vac.day}, 2026`, margin + 3, y + 5);
    doc.text(vac.name, margin + 35, y + 5);
    doc.text(vac.disease, margin + 82, y + 5);
    doc.text(vac.animal, margin + 130, y + 5);

    if (vac.isOverdue) {
      doc.setTextColor(198, 40, 40);
      doc.setFont('helvetica', 'bold');
      doc.text('OVERDUE (Action Req)', margin + 160, y + 5);
    } else {
      doc.setTextColor(21, 101, 192);
      doc.setFont('helvetica', 'normal');
      doc.text('Upcoming', margin + 160, y + 5);
    }

    y += 7.5;
  });

  y += 6;

  // 5. Section: Clinical Alerts & Symptom Log
  doc.setTextColor(26, 60, 43);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('3. Active Clinical Observations & Farmer Logs', margin, y);
  y += 6;

  const defaultAlerts: ExportAlertData[] = alertsList || [
    {
      severity: 'Urgent',
      tag: 'IN-GJ-3090',
      animal: 'Moti',
      title: 'PPR booster 5 days overdue',
      desc: 'Sirohi goat requires immediate live attenuated Sungri 96 booster to maintain regional immunity.',
      nextStep: 'Administer 1 ml subcutaneous vaccine; isolate if fever or nasal discharge occurs.'
    },
    {
      severity: 'Watch',
      tag: 'IN-GJ-1042',
      animal: 'Gauri',
      title: 'Gestation Month 6 Nutritional Support',
      desc: 'Crossbred cow in 6th month of pregnancy; dry matter intake 17.1 kg/day.',
      nextStep: 'Recommend 0.8 kg concentrate supplement with chelated minerals (Ca/P balance).'
    },
    {
      severity: 'Watch',
      tag: 'IN-GJ-1088',
      animal: 'Lakshmi',
      title: '18% Acute Morning Milk Drop & Mild Lethargy',
      desc: 'Morning milk yield declined to 5.2 L. Rectal temperature recorded at 39.4°C.',
      nextStep: 'Vet examination requested: CMT paddle test for mastitis and tick inspection.'
    }
  ];

  defaultAlerts.forEach((alert) => {
    doc.setFillColor(243, 242, 237);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 14, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    if (alert.severity === 'Urgent') {
      doc.setTextColor(198, 40, 40);
    } else {
      doc.setTextColor(230, 81, 0);
    }
    doc.text(`[${alert.severity.toUpperCase()}] ${alert.animal} (${alert.tag}): ${alert.title}`, margin + 3, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.text(alert.desc, margin + 3, y + 9);
    doc.setTextColor(26, 60, 43);
    doc.text(`Recommended Action: ${alert.nextStep}`, margin + 3, y + 12.5);

    y += 17;
  });

  y += 4;

  // 6. Section: Visiting Veterinarian Clinical Assessment & Prescription Box
  doc.setTextColor(26, 60, 43);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('4. Veterinary Doctor Clinical Notes & Rx Prescription', margin, y);
  y += 5;

  // Prescription Box
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 38, 3, 3, 'D');

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('Physical Observations / Clinical Findings / Rx Treatment Prescribed:', margin + 4, y + 6);

  // Dotted lines for handwritten notes
  for (let i = 1; i <= 3; i++) {
    doc.setDrawColor(229, 231, 235);
    doc.line(margin + 4, y + 6 + (i * 7), pageWidth - margin - 4, y + 6 + (i * 7));
  }

  // Signature Block at bottom of prescription box
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text('Veterinary Surgeon Signature: _________________________', margin + 4, y + 33);
  doc.text('Reg. No. / Vet Council Stamp: _________________________', margin + 105, y + 33);

  // Footer Note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);
  doc.text('Generated via AniGuard AI Farm Intelligence System · Digital Health Passport for Indian Dairy Farmers', pageWidth / 2, pageHeight - 6, { align: 'center' });

  // Save / Download PDF
  const filename = `AniGuard_Vet_Record_${(profile.name || 'Ramesh').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
  return filename;
}
