import { jsPDF } from 'jspdf';

export interface RescueReportPayload {
  branding: string;
  incidentId: string;
  reportReference: string;
  incidentDate: string;
  incidentTime: string;
  amountInvolved: string;
  paymentMethod: string;
  transactionReference: string;
  bankProvider: string;
  suspectedCategory: string;
  summary: string;
  evidenceIndex: Array<{
    id: string;
    type: string;
    title: string;
    summary: string;
    timestamp: string;
  }>;
  chronologicalTimeline: Array<{
    time: string;
    title: string;
    detail: string;
  }>;
  actionsTaken: string[];
  pendingActions: string[];
  officialGuidance: {
    helpline: string;
    portal: string;
    bankNote: string;
  };
  mandatoryDisclaimer: string;
}

export function downloadRescuePdf(report: RescueReportPayload) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 44;
  const maxWidth = pageWidth - margin * 2;
  let y = 50;

  const ensureSpace = (needed = 48) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      y = 50;
    }
  };

  const addHeading = (title: string) => {
    ensureSpace(36);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(16, 21, 18);
    doc.text(title, margin, y);
    y += 16;
    doc.setDrawColor(210, 218, 212);
    doc.line(margin, y - 10, pageWidth - margin, y - 10);
  };

  const addBody = (text: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40, 48, 43);
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      ensureSpace(16);
      doc.text(line, margin, y);
      y += 14;
    }
  };

  // Header Banner
  doc.setFillColor(16, 21, 18);
  doc.rect(0, 0, pageWidth, 82, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(36, 199, 138);
  doc.text('FINSHIELD AI — INCIDENT EVIDENCE DOSSIER', margin, 36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(244, 247, 244);
  doc.text(
    `Incident ID: ${report.incidentId}   |   Report Ref: ${report.reportReference}`,
    margin,
    58
  );

  y = 108;

  // Disclaimer Box
  doc.setFillColor(248, 240, 232);
  doc.rect(margin, y - 12, maxWidth, 44, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(140, 45, 25);
  const discLines = doc.splitTextToSize(report.mandatoryDisclaimer, maxWidth - 16);
  doc.text(discLines, margin + 8, y + 2);
  y += 48;

  addHeading('1. Incident Summary & Financial Details');
  addBody(`Date & Time: ${report.incidentDate} at ${report.incidentTime}`);
  addBody(`Amount Involved: ${report.amountInvolved}`);
  addBody(`Payment Method: ${report.paymentMethod}`);
  addBody(`Bank / Provider: ${report.bankProvider}`);
  addBody(`Transaction Reference: ${report.transactionReference}`);
  addBody(`Suspected Category: ${report.suspectedCategory}`);
  y += 6;
  addBody(`Description: ${report.summary}`);
  y += 10;

  addHeading('2. Chronological Timeline');
  if (report.chronologicalTimeline.length === 0) {
    addBody('No timeline entries recorded.');
  } else {
    for (const ev of report.chronologicalTimeline) {
      addBody(`${ev.time} — ${ev.title}`, true);
      addBody(ev.detail);
      y += 4;
    }
  }
  y += 8;

  addHeading('3. Evidence Index');
  if (report.evidenceIndex.length === 0) {
    addBody('No additional evidence files indexed yet.');
  } else {
    report.evidenceIndex.forEach((item, idx) => {
      addBody(`${idx + 1}. [${item.type.toUpperCase()}] ${item.title} (${item.timestamp})`, true);
      if (item.summary) addBody(`   ${item.summary}`);
    });
  }
  y += 8;

  addHeading('4. Actions Taken & Pending Actions');
  addBody('Actions Already Taken:', true);
  if (report.actionsTaken.length === 0) {
    addBody('• None recorded yet.');
  } else {
    report.actionsTaken.forEach((a) => addBody(`• ${a}`));
  }
  y += 4;
  addBody('Pending Actions:', true);
  report.pendingActions.forEach((p) => addBody(`• ${p}`));
  y += 8;

  addHeading('5. Official Reporting Guidance');
  addBody(`National Cyber Crime Helpline: ${report.officialGuidance.helpline}`, true);
  addBody(`Official Reporting Portal: ${report.officialGuidance.portal}`);
  addBody(report.officialGuidance.bankNote);

  doc.save(`FINSHIELD-RESCUE-${report.incidentId}.pdf`);
}
