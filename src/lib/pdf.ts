import { readFile } from "node:fs/promises";
import path from "node:path";
import { format } from "date-fns";
import {
  PDFDocument,
  StandardFonts,
  appendBezierCurve,
  clip,
  closePath,
  endPath,
  moveTo,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import { COMPANY, companyAddressLine, companyPhoneLine, paymentMethodLabel } from "@/lib/company";
import { formatDate } from "@/lib/dates";
import { clientStatus, runningLedger, type ClientWithEntries } from "@/lib/ledger";
import { formatMoneyPdf } from "@/lib/money";

const TEAL = rgb(0.14, 0.52, 0.52);
const TEAL_DEEP = rgb(0.08, 0.3, 0.31);
const INK = rgb(0.07, 0.09, 0.11);
const MUTED = rgb(0.28, 0.32, 0.34);
const FOOTER = rgb(0.16, 0.2, 0.22);
const HAIR = rgb(0.78, 0.84, 0.84);
const WASH = rgb(0.96, 0.98, 0.98);
const RED = rgb(0.68, 0.1, 0.14);
const WHITE = rgb(1, 1, 1);

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 48;
const CELL_PAD = 12;

const ICON_PIN =
  "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z";
const ICON_PHONE =
  "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z";
const ICON_MAIL = "M3 5 L21 5 L21 19 L3 19 Z M3 5 L12 12.5 L21 5";

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

function drawRight(
  page: PDFPage,
  text: string,
  right: number,
  y: number,
  font: PDFFont,
  size: number,
  color = INK,
) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: right - width, y, size, font, color });
}

function drawTracked(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  tracking: number,
  color = INK,
) {
  let cursor = x;
  for (const character of text) {
    page.drawText(character, { x: cursor, y, size, font, color });
    cursor += font.widthOfTextAtSize(character, size) + tracking;
  }
}

function fitLine(text: string, font: PDFFont, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let cut = text.trimEnd();
  while (cut.length && font.widthOfTextAtSize(`${cut}…`, size) > maxWidth) {
    cut = cut.slice(0, -1).trimEnd();
  }
  return cut ? `${cut}…` : "…";
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number, maxLines = Infinity) {
  const words = text.split(/\s+/).filter(Boolean);
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

  const fitted = lines.map((line) => fitLine(line, font, size, maxWidth));
  if (fitted.length <= maxLines) return fitted;

  const kept = fitted.slice(0, maxLines);
  kept[maxLines - 1] = fitLine(`${kept[maxLines - 1].replace(/…$/, "")}…`, font, size, maxWidth);
  return kept;
}

function wrapParticulars(text: string, font: PDFFont, size: number, maxWidth: number) {
  const segments = text.split(" · ").map((part) => part.trim()).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const segment of segments) {
    const next = current ? `${current} · ${segment}` : segment;
    if (current && font.widthOfTextAtSize(next, size) > maxWidth) {
      lines.push(current);
      const leftover = wrapText(segment, font, size, maxWidth);
      current = leftover[0] ?? "";
      lines.push(...leftover.slice(1));
    } else if (!current && font.widthOfTextAtSize(segment, size) > maxWidth) {
      const leftover = wrapText(segment, font, size, maxWidth);
      lines.push(...leftover.slice(0, -1));
      current = leftover.at(-1) ?? "";
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);

  const fitted = lines.map((line) => fitLine(line, font, size, maxWidth));
  if (fitted.length <= 2) return fitted;
  const kept = fitted.slice(0, 2);
  kept[1] = fitLine(`${kept[1].replace(/…$/, "")}…`, font, size, maxWidth);
  return kept;
}

function drawStrokeIcon(page: PDFPage, path: string, x: number, y: number, size: number, color: RGB) {
  page.drawSvgPath(path, {
    x,
    y: y + size - 1.5,
    scale: size / 24,
    borderColor: color,
    borderWidth: 1.75,
  });
}

function drawCircularLogo(page: PDFPage, logo: PDFImage, x: number, y: number, size: number) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2 - 1.25;
  const k = 0.552284749831;
  page.pushOperators(
    pushGraphicsState(),
    moveTo(cx + r, cy),
    appendBezierCurve(cx + r, cy + k * r, cx + k * r, cy + r, cx, cy + r),
    appendBezierCurve(cx - k * r, cy + r, cx - r, cy + k * r, cx - r, cy),
    appendBezierCurve(cx - r, cy - k * r, cx - k * r, cy - r, cx, cy - r),
    appendBezierCurve(cx + k * r, cy - r, cx + r, cy - k * r, cx + r, cy),
    closePath(),
    clip(),
    endPath(),
  );
  page.drawImage(logo, { x, y, width: size, height: size });
  page.pushOperators(popGraphicsState());
}

function drawLetterhead(
  page: PDFPage,
  logo: Awaited<ReturnType<typeof loadLogo>>,
  fonts: { regular: PDFFont; bold: PDFFont },
  documentTitle: string,
  meta: string,
) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: height - 5, width, height: 5, color: TEAL });

  const top = height - 36;
  const logoWidth = 68;
  const logoHeight = logo ? logoWidth : 0;

  const nameLines = ["CUBITY ENGINEERING &", "CONSTRUCTION COMPANY"];
  const nameSize = 14;
  const nameLeading = 17;
  const titleSize = 10;
  const textHeight = nameLines.length * nameLeading + 18 + titleSize;
  const blockHeight = Math.max(logoHeight, textHeight);
  const blockBottom = top - blockHeight;
  const textRight = width - MARGIN;

  if (logo) {
    drawCircularLogo(
      page,
      logo,
      MARGIN,
      blockBottom + (blockHeight - logoHeight) / 2,
      logoWidth,
    );
  }

  let textY = blockBottom + blockHeight - 12;
  if (textHeight < blockHeight) {
    textY -= (blockHeight - textHeight) / 2;
  }
  for (const line of nameLines) {
    drawRight(page, line, textRight, textY, fonts.bold, nameSize, TEAL);
    textY -= nameLeading;
  }
  textY -= 4;
  let titleWidth = 0;
  for (const character of documentTitle) {
    titleWidth += fonts.bold.widthOfTextAtSize(character, titleSize) + 1.15;
  }
  if (documentTitle.length) titleWidth -= 1.15;
  drawTracked(page, documentTitle, textRight - titleWidth, textY, fonts.bold, titleSize, 1.15, INK);
  textY -= 13;
  drawRight(page, meta, textRight, textY, fonts.regular, 9, MUTED);

  const ruleY = blockBottom - 14;
  page.drawLine({
    start: { x: MARGIN, y: ruleY + 1.6 },
    end: { x: width - MARGIN, y: ruleY + 1.6 },
    thickness: 1.25,
    color: TEAL,
  });
  page.drawLine({
    start: { x: MARGIN, y: ruleY },
    end: { x: width - MARGIN, y: ruleY },
    thickness: 0.4,
    color: HAIR,
  });

  return ruleY - 22;
}

function drawContactFooter(page: PDFPage, font: PDFFont) {
  const { width } = page.getSize();
  page.drawLine({
    start: { x: MARGIN, y: 68 },
    end: { x: width - MARGIN, y: 68 },
    thickness: 0.5,
    color: HAIR,
  });

  const iconSize = 12;
  const gap = 8;
  const size = 10;
  const rows = [
    { path: ICON_PIN, text: companyAddressLine() },
    { path: ICON_PHONE, text: companyPhoneLine() },
    { path: ICON_MAIL, text: COMPANY.email },
  ];
  const blockWidth = Math.max(
    ...rows.map((row) => iconSize + gap + font.widthOfTextAtSize(row.text, size)),
  );
  const left = (width - blockWidth) / 2;
  let y = 48;

  for (const row of rows) {
    drawStrokeIcon(page, row.path, left, y, iconSize, TEAL);
    drawText(page, row.text, left + iconSize + gap, y, font, size, FOOTER);
    y -= 16;
  }
}

export async function buildClientStatementPdf(client: ClientWithEntries) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await loadLogo(pdf);
  const status = clientStatus(client);
  const lines = runningLedger(client.entries);

  let page = pdf.addPage([PAGE.width, PAGE.height]);
  let { width, height } = page.getSize();
  let y = drawLetterhead(page, logo, { regular, bold }, "DUE STATEMENT", `Issued ${format(new Date(), "dd MMMM yyyy")}`);

  drawText(page, "BILLED TO", MARGIN, y, regular, 8, MUTED);
  drawText(page, client.name, MARGIN, y - 16, bold, 14, INK);
  const details = [
    client.organization,
    client.phone,
    client.email,
    client.address,
    client.siteName ? `Site / project: ${client.siteName}` : null,
  ].filter(Boolean) as string[];

  let detailY = y - 33;
  for (const detail of details) {
    drawText(page, detail, MARGIN, detailY, regular, 10, MUTED);
    detailY -= 13;
  }

  const boxWidth = 232;
  const box = {
    x: width - MARGIN - boxWidth,
    width: boxWidth,
    height: 96,
    bottom: y - 82,
  };
  page.drawRectangle({
    x: box.x,
    y: box.bottom,
    width: box.width,
    height: box.height,
    color: WASH,
  });
  page.drawRectangle({
    x: box.x,
    y: box.bottom,
    width: 3,
    height: box.height,
    color: TEAL,
  });

  const innerLeft = box.x + 16;
  const innerRight = box.x + box.width - 14;
  let boxY = box.bottom + box.height - 16;
  drawTracked(page, "OUTSTANDING", innerLeft, boxY, bold, 8, 0.9, MUTED);
  boxY -= 18;
  drawText(page, formatMoneyPdf(status.outstanding), innerLeft, boxY, bold, 19, RED);
  boxY -= 12;
  page.drawLine({
    start: { x: innerLeft, y: boxY },
    end: { x: innerRight, y: boxY },
    thickness: 0.4,
    color: HAIR,
  });
  boxY -= 13;
  drawText(page, "Billed", innerLeft, boxY, regular, 9, MUTED);
  drawRight(page, formatMoneyPdf(status.totalDue), innerRight, boxY, regular, 9, INK);
  boxY -= 14;
  drawText(page, "Paid", innerLeft, boxY, regular, 9, MUTED);
  drawRight(page, formatMoneyPdf(status.totalPaid), innerRight, boxY, regular, 9, INK);
  if (status.promised && status.outstanding > 0) {
    boxY -= 14;
    drawText(
      page,
      status.overdue ? "Overdue since" : "Promised by",
      innerLeft,
      boxY,
      regular,
      9,
      status.overdue ? RED : MUTED,
    );
    drawRight(
      page,
      formatDate(status.promised),
      innerRight,
      boxY,
      regular,
      9,
      status.overdue ? RED : INK,
    );
  }

  y = Math.min(detailY, box.bottom) - 28;

  const cols = {
    date: MARGIN,
    details: 122,
    due: 348,
    paid: 422,
    pending: 496,
  };
  const particularsWidth = cols.due - 10 - cols.details;

  function headerRow(currentPage: PDFPage, headerY: number) {
    currentPage.drawRectangle({
      x: MARGIN,
      y: headerY - 8,
      width: width - MARGIN * 2,
      height: 24,
      color: TEAL_DEEP,
    });
    currentPage.drawText("Date", {
      x: cols.date + CELL_PAD,
      y: headerY,
      size: 9,
      font: bold,
      color: WHITE,
    });
    currentPage.drawText("Particulars", {
      x: cols.details,
      y: headerY,
      size: 9,
      font: bold,
      color: WHITE,
    });
    currentPage.drawText("Due", {
      x: cols.due,
      y: headerY,
      size: 9,
      font: bold,
      color: WHITE,
    });
    currentPage.drawText("Paid", {
      x: cols.paid,
      y: headerY,
      size: 9,
      font: bold,
      color: WHITE,
    });
    currentPage.drawText("Pending", {
      x: cols.pending,
      y: headerY,
      size: 9,
      font: bold,
      color: WHITE,
    });
  }

  headerRow(page, y);
  y -= 26;

  if (lines.length === 0) {
    drawText(page, "No dues or payments recorded yet.", MARGIN, y, regular, 10, MUTED);
  }

  for (const [index, line] of lines.entries()) {
    const detailParts = [
      line.entry.type === "DUE" ? "Due billed" : "Payment received",
      paymentMethodLabel(line.entry.method),
      line.entry.note,
      line.entry.promisedDate ? `Balance promised ${formatDate(line.entry.promisedDate)}` : null,
    ].filter(Boolean);
    const wrapped = wrapParticulars(detailParts.join(" · "), regular, 9, particularsWidth);
    const rowHeight = 22 + Math.max(0, wrapped.length - 1) * 13;

    if (y - rowHeight < 128) {
      page = pdf.addPage([PAGE.width, PAGE.height]);
      ({ width, height } = page.getSize());
      y = height - 48;
      headerRow(page, y);
      y -= 26;
    }

    if (index % 2 === 0) {
      page.drawRectangle({
        x: MARGIN,
        y: y - rowHeight + 8,
        width: width - MARGIN * 2,
        height: rowHeight,
        color: WASH,
      });
    }

    drawText(page, formatDate(line.entry.date), cols.date + CELL_PAD, y, regular, 9, INK);
    drawText(page, wrapped[0] ?? "", cols.details, y, regular, 9, MUTED);
    drawText(page, line.due ? formatMoneyPdf(line.due) : "—", cols.due, y, regular, 9, INK);
    drawText(page, line.paid ? formatMoneyPdf(line.paid) : "—", cols.paid, y, regular, 9, INK);
    drawText(page, formatMoneyPdf(line.balance), cols.pending, y, bold, 9, INK);

    let extraY = y - 13;
    for (const extra of wrapped.slice(1)) {
      drawText(page, extra, cols.details, extraY, regular, 9, MUTED);
      extraY -= 12;
    }
    y -= rowHeight;
  }

  y -= 8;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: width - MARGIN, y },
    thickness: 0.6,
    color: HAIR,
  });
  y -= 18;
  drawRight(page, "Amount still pending", cols.pending - 8, y, regular, 10, MUTED);
  drawText(page, formatMoneyPdf(status.outstanding), cols.pending, y, bold, 13, RED);

  y -= 32;
  if (client.notes) {
    drawTracked(page, "NOTES", MARGIN, y, bold, 8, 0.8, MUTED);
    y -= 14;
    for (const noteLine of wrapText(client.notes, regular, 10, width - MARGIN * 2)) {
      drawText(page, noteLine, MARGIN, y, regular, 10, MUTED);
      y -= 13;
    }
  }

  drawContactFooter(page, regular);
  return pdf.save();
}

export async function buildOutstandingSummaryPdf(clients: ClientWithEntries[]) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await loadLogo(pdf);
  const withDues = clients
    .map((client) => ({ client, status: clientStatus(client) }))
    .filter((item) => item.status.outstanding > 0)
    .sort((a, b) => b.status.outstanding - a.status.outstanding);

  const total = withDues.reduce((sum, item) => sum + item.status.outstanding, 0);

  let page = pdf.addPage([PAGE.width, PAGE.height]);
  let { width, height } = page.getSize();
  let y = drawLetterhead(
    page,
    logo,
    { regular, bold },
    "OUTSTANDING RECEIVABLES",
    `${format(new Date(), "dd MMMM yyyy")}  ·  ${withDues.length} client${withDues.length === 1 ? "" : "s"}`,
  );

  page.drawRectangle({
    x: MARGIN,
    y: y - 8,
    width: width - MARGIN * 2,
    height: 24,
    color: TEAL_DEEP,
  });
  page.drawText("Client", { x: MARGIN + CELL_PAD, y, size: 9, font: bold, color: WHITE });
  page.drawText("Phone", { x: 220, y, size: 9, font: bold, color: WHITE });
  page.drawText("Promised", { x: 340, y, size: 9, font: bold, color: WHITE });
  drawRight(page, "Outstanding", width - MARGIN - CELL_PAD, y, bold, 9, WHITE);
  y -= 26;

  if (withDues.length === 0) {
    drawText(page, "No outstanding receivables.", MARGIN + 8, y, regular, 10, MUTED);
  }

  for (const [index, item] of withDues.entries()) {
    if (y < 90) {
      page = pdf.addPage([PAGE.width, PAGE.height]);
      ({ width, height } = page.getSize());
      y = height - 48;
    }
    if (index % 2 === 0) {
      page.drawRectangle({ x: MARGIN, y: y - 8, width: width - MARGIN * 2, height: 20, color: WASH });
    }
    drawText(page, item.client.name.slice(0, 28), MARGIN + CELL_PAD, y, bold, 10);
    drawText(page, item.client.phone, 220, y, regular, 9, MUTED);
    drawText(
      page,
      item.status.promised ? formatDate(item.status.promised) : "Not set",
      340,
      y,
      regular,
      9,
      item.status.overdue ? RED : MUTED,
    );
    drawRight(page, formatMoneyPdf(item.status.outstanding), width - MARGIN - CELL_PAD, y, bold, 10, RED);
    y -= 22;
  }

  y -= 12;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: width - MARGIN, y },
    thickness: 0.6,
    color: HAIR,
  });
  y -= 18;
  drawRight(page, "Total receivable", width - MARGIN - 90, y, regular, 10, MUTED);
  drawRight(page, formatMoneyPdf(total), width - MARGIN - CELL_PAD, y, bold, 13, RED);

  drawContactFooter(page, regular);
  return pdf.save();
}
