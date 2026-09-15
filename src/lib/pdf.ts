import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { COMPANY, paymentMethodLabel } from "@/lib/company";
import { formatDate } from "@/lib/dates";
import { clientStatus, runningLedger, type ClientWithEntries } from "@/lib/ledger";
import { formatMoneyPdf } from "@/lib/money";

const TEAL = rgb(0.18, 0.67, 0.66);
const INK = rgb(0.08, 0.1, 0.12);
const MUTED = rgb(0.35, 0.4, 0.42);
const LINE = rgb(0.82, 0.88, 0.88);
const ROW = rgb(0.95, 0.98, 0.98);

async function loadLogo(pdf: PDFDocument) {
  try {
    const bytes = await readFile(path.join(process.cwd(), "public", "cubity-logo.jpg"));
    return pdf.embedJpg(bytes);
  } catch {
    return null;
  }
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color = INK,
) {
  page.drawText(text, { x, y, size, font, color });
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function buildClientStatementPdf(client: ClientWithEntries) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await loadLogo(pdf);
  const status = clientStatus(client);
  const lines = runningLedger(client.entries);

  let page = pdf.addPage([595.28, 841.89]);
  let { width, height } = page.getSize();
  let y = height - 36;

  if (logo) {
    const logoWidth = 72;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    page.drawImage(logo, {
      x: 40,
      y: y - logoHeight + 8,
      width: logoWidth,
      height: logoHeight,
    });
  }

  drawText(page, COMPANY.legalName.toUpperCase(), 128, y - 8, bold, 11, TEAL);
  drawText(page, "DUE STATEMENT", 128, y - 24, bold, 18, INK);
  drawText(page, `Issued ${formatDate(new Date())}`, 128, y - 40, font, 9, MUTED);

  y -= 78;
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1.5, color: TEAL });
  y -= 22;

  drawText(page, "Billed to", 40, y, font, 8, MUTED);
  drawText(page, client.name, 40, y - 14, bold, 13);
  const details = [
    client.organization,
    client.phone,
    client.email,
    client.address,
    client.siteName ? `Site / project: ${client.siteName}` : null,
  ].filter(Boolean) as string[];

  let detailY = y - 30;
  for (const detail of details) {
    drawText(page, detail, 40, detailY, font, 9, MUTED);
    detailY -= 12;
  }

  const boxX = 340;
  page.drawRectangle({
    x: boxX,
    y: y - 72,
    width: 215,
    height: 86,
    color: ROW,
    borderColor: TEAL,
    borderWidth: 1,
  });
  drawText(page, "OUTSTANDING", boxX + 14, y - 8, font, 8, MUTED);
  drawText(page, formatMoneyPdf(status.outstanding), boxX + 14, y - 28, bold, 16, TEAL);
  drawText(page, `Total billed  ${formatMoneyPdf(status.totalDue)}`, boxX + 14, y - 46, font, 9, INK);
  drawText(page, `Total paid    ${formatMoneyPdf(status.totalPaid)}`, boxX + 14, y - 60, font, 9, INK);
  if (status.promised && status.outstanding > 0) {
    drawText(
      page,
      `${status.overdue ? "Overdue since" : "Promised by"} ${formatDate(status.promised)}`,
      boxX + 14,
      y - 74,
      font,
      8,
      status.overdue ? rgb(0.7, 0.2, 0.2) : MUTED,
    );
  }

  y = Math.min(detailY, y - 92) - 12;

  const cols = {
    date: 40,
    details: 110,
    due: 330,
    paid: 410,
    balance: 490,
  };

  function headerRow(currentPage: PDFPage, headerY: number) {
    currentPage.drawRectangle({
      x: 40,
      y: headerY - 6,
      width: width - 80,
      height: 20,
      color: TEAL,
    });
    const headerColor = rgb(1, 1, 1);
    currentPage.drawText("Date", { x: cols.date + 6, y: headerY, size: 8, font: bold, color: headerColor });
    currentPage.drawText("Details", { x: cols.details, y: headerY, size: 8, font: bold, color: headerColor });
    currentPage.drawText("Due", { x: cols.due, y: headerY, size: 8, font: bold, color: headerColor });
    currentPage.drawText("Paid", { x: cols.paid, y: headerY, size: 8, font: bold, color: headerColor });
    currentPage.drawText("Balance", { x: cols.balance, y: headerY, size: 8, font: bold, color: headerColor });
  }

  headerRow(page, y);
  y -= 22;

  if (lines.length === 0) {
    drawText(page, "No dues or payments recorded yet.", 40, y, font, 10, MUTED);
  }

  for (const [index, line] of lines.entries()) {
    if (y < 80) {
      page = pdf.addPage([595.28, 841.89]);
      ({ width, height } = page.getSize());
      y = height - 48;
      headerRow(page, y);
      y -= 22;
    }

    if (index % 2 === 0) {
      page.drawRectangle({
        x: 40,
        y: y - 8,
        width: width - 80,
        height: 20,
        color: ROW,
      });
    }

    const detailParts = [
      line.entry.type === "DUE" ? "Due added" : "Payment received",
      paymentMethodLabel(line.entry.method),
      line.entry.note,
      line.entry.promisedDate ? `Promised remaining: ${formatDate(line.entry.promisedDate)}` : null,
    ].filter(Boolean);
    const detail = detailParts.join(" · ");
    const wrapped = wrapText(detail, font, 8, 200);

    drawText(page, formatDate(line.entry.date), cols.date + 6, y, font, 8);
    drawText(page, wrapped[0] ?? "", cols.details, y, font, 8, MUTED);
    drawText(page, line.due ? formatMoneyPdf(line.due) : "—", cols.due, y, font, 8);
    drawText(page, line.paid ? formatMoneyPdf(line.paid) : "—", cols.paid, y, font, 8);
    drawText(page, formatMoneyPdf(line.balance), cols.balance, y, bold, 8);

    y -= 16;
    for (const extra of wrapped.slice(1)) {
      drawText(page, extra, cols.details, y, font, 8, MUTED);
      y -= 12;
    }
    y -= 4;
  }

  y -= 10;
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: LINE });
  y -= 18;
  drawText(page, "Amount still pending", 330, y, font, 9, MUTED);
  drawText(page, formatMoneyPdf(status.outstanding), 450, y, bold, 12, TEAL);

  y -= 36;
  if (client.notes) {
    drawText(page, "Client notes", 40, y, bold, 9, INK);
    y -= 14;
    for (const noteLine of wrapText(client.notes, font, 9, width - 80)) {
      drawText(page, noteLine, 40, y, font, 9, MUTED);
      y -= 12;
    }
    y -= 10;
  }

  drawText(
    page,
    "This statement lists dues billed and payments received by Cubity. Please settle the outstanding balance by the promised date.",
    40,
    48,
    font,
    8,
    MUTED,
  );
  drawText(page, COMPANY.legalName, 40, 34, bold, 8, TEAL);

  return pdf.save();
}

export async function buildOutstandingSummaryPdf(clients: ClientWithEntries[]) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await loadLogo(pdf);
  const withDues = clients
    .map((client) => ({ client, status: clientStatus(client) }))
    .filter((item) => item.status.outstanding > 0)
    .sort((a, b) => b.status.outstanding - a.status.outstanding);

  const total = withDues.reduce((sum, item) => sum + item.status.outstanding, 0);

  let page = pdf.addPage([595.28, 841.89]);
  let { width, height } = page.getSize();
  let y = height - 40;

  if (logo) {
    const logoWidth = 64;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    page.drawImage(logo, { x: 40, y: y - logoHeight + 6, width: logoWidth, height: logoHeight });
  }

  drawText(page, COMPANY.legalName.toUpperCase(), 118, y - 6, bold, 11, TEAL);
  drawText(page, "OUTSTANDING RECEIVABLES", 118, y - 24, bold, 16, INK);
  drawText(
    page,
    `${formatDate(new Date())}  ·  ${withDues.length} client${withDues.length === 1 ? "" : "s"}  ·  ${formatMoneyPdf(total)} due`,
    118,
    y - 40,
    font,
    9,
    MUTED,
  );

  y -= 72;
  page.drawRectangle({ x: 40, y: y - 6, width: width - 80, height: 20, color: TEAL });
  const white = rgb(1, 1, 1);
  page.drawText("Client", { x: 48, y, size: 8, font: bold, color: white });
  page.drawText("Phone", { x: 220, y, size: 8, font: bold, color: white });
  page.drawText("Promised", { x: 340, y, size: 8, font: bold, color: white });
  page.drawText("Outstanding", { x: 450, y, size: 8, font: bold, color: white });
  y -= 22;

  if (withDues.length === 0) {
    drawText(page, "No outstanding receivables.", 48, y, font, 10, MUTED);
  }

  for (const [index, item] of withDues.entries()) {
    if (y < 60) {
      page = pdf.addPage([595.28, 841.89]);
      ({ width, height } = page.getSize());
      y = height - 48;
    }
    if (index % 2 === 0) {
      page.drawRectangle({ x: 40, y: y - 8, width: width - 80, height: 20, color: ROW });
    }
    drawText(page, item.client.name.slice(0, 28), 48, y, bold, 9);
    drawText(page, item.client.phone, 220, y, font, 8, MUTED);
    drawText(
      page,
      item.status.promised ? formatDate(item.status.promised) : "Not set",
      340,
      y,
      font,
      8,
      item.status.overdue ? rgb(0.7, 0.2, 0.2) : MUTED,
    );
    drawText(page, formatMoneyPdf(item.status.outstanding), 450, y, bold, 9, TEAL);
    y -= 20;
  }

  y -= 16;
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: LINE });
  y -= 18;
  drawText(page, "Total the company will receive", 300, y, font, 9, MUTED);
  drawText(page, formatMoneyPdf(total), 450, y, bold, 12, TEAL);

  return pdf.save();
}
