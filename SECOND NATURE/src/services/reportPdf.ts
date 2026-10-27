/** Small, offline PDF 1.7 writer for this English-language game report.
 * Uses standard PDF fonts and embeds original UTF-8 data without a network call.
 * All PDF syntax is ASCII; binary attachment data is losslessly hex encoded.
 */
const ascii = (value: unknown) => String(value ?? '')
  .replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"')
  .replace(/[\u2010-\u2015\u2212]/g, '-').replace(/\u2026/g, '...')
  .replace(/\u00a0/g, ' ').replace(/[^\x20-\x7e\n]/g, '?');
const literal = (value: unknown) => '(' + ascii(value).replace(/([\\()])/g, '\\$1').replace(/\n/g, '\\n') + ')';
const number = (n: number) => Number(n.toFixed(2));
// Adobe Helvetica character advances, in thousandths of an em.
const advances = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,
  556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,
  667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,
  278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
const width = (s: string, size: number) => [...s].reduce((sum, c) => sum + (advances[c.charCodeAt(0) - 32] ?? 600), 0) * size / 1000;

export class ReportPdf {
  readonly pageWidth = 595.28;
  readonly pageHeight = 841.89;
  readonly margin = 44;
  readonly contentWidth = this.pageWidth - 2 * this.margin;
  private objects: string[] = [];
  private pages: Array<{ ref: number; commands: string[] }> = [];
  private current!: { ref: number; commands: string[] };
  private pageTree: number;
  private regular: number;
  private bold: number;
  y = 0;

  constructor() {
    this.regular = this.object('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    this.bold = this.object('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    this.pageTree = this.object('');
  }
  private object(body: string) { this.objects.push(body); return this.objects.length; }
  private command(value: string) { this.current.commands.push(value); }
  page(section: string) {
    this.current = { ref: this.object(''), commands: [] };
    this.pages.push(this.current);
    this.rect(0, 0, this.pageWidth, 11, '0.17 0.36 0.29');
    this.text('SECOND NATURE', this.margin, 35, 9, true, '0.17 0.36 0.29');
    this.text(section.toUpperCase(), this.margin, 55, 8, false, '0.4 0.44 0.42');
    this.y = 82;
  }
  ensure(height: number, section = 'Your day / continued') {
    if (!this.current || this.y + height > this.pageHeight - 58) this.page(section);
  }
  text(value: unknown, x: number, top: number, size = 10, bold = false, color = '0.12 0.16 0.14') {
    this.command(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${color} rg 1 0 0 1 ${number(x)} ${number(this.pageHeight - top - size)} Tm ${literal(value)} Tj ET`);
  }
  rect(x: number, top: number, w: number, h: number, color: string) {
    this.command(`${color} rg ${number(x)} ${number(this.pageHeight - top - h)} ${number(w)} ${number(h)} re f`);
  }
  lines(value: unknown, size = 10, maxWidth = this.contentWidth): string[] {
    const result: string[] = [];
    for (const paragraph of ascii(value).split('\n')) {
      let line = '';
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const candidate = line ? `${line} ${word}` : word;
        if (width(candidate, size) > maxWidth && line) { result.push(line); line = ''; }
        // Long IDs are broken too, so they cannot run into the margin.
        if (width(word, size) > maxWidth) {
          let part = '';
          for (const char of word) {
            if (width(part + char, size) > maxWidth) { result.push(part); part = ''; }
            part += char;
          }
          line = part;
        } else line = line ? `${line} ${word}` : word;
      }
      result.push(line);
    }
    return result;
  }
  paragraph(value: unknown, size = 10, color?: string) {
    for (const line of this.lines(value, size)) {
      this.ensure(size * 1.48);
      this.text(line, this.margin, this.y, size, false, color);
      this.y += size * 1.48;
    }
    this.y += 8;
  }
  heading(value: string, size = 17) {
    const lines = this.lines(value, size, this.contentWidth - 25);
    this.ensure(lines.length * size * 1.35 + 44);
    for (const line of lines) { this.text(line, this.margin, this.y, size, true); this.y += size * 1.35; }
    this.y += 9;
  }
  table(headers: string[], rows: string[][], widths: number[], section: string, compact = false) {
    const header = () => {
      this.rect(this.margin, this.y, this.contentWidth, 25, '0.9 0.94 0.91');
      let x = this.margin + 7;
      headers.forEach((s, i) => { this.text(s, x, this.y + 6, 8, true); x += widths[i]; });
      this.y += 25;
    };
    this.ensure(55, section); header();
    for (const row of rows) {
      const wrapped = row.map((cell, i) => this.lines(cell, 8.5, widths[i] - 14));
      const height = Math.max(...wrapped.map(lines => lines.length)) * 12 + (compact ? 6 : 13);
      if (this.y + height > this.pageHeight - 58) { this.page(section); header(); }
      let x = this.margin + 7;
      wrapped.forEach((lines, i) => { lines.forEach((s, j) => this.text(s, x, this.y + (compact ? 3 : 6) + j * 12, 8.5)); x += widths[i]; });
      this.rect(this.margin, this.y + height - 1, this.contentWidth, 0.5, '0.85 0.88 0.86');
      this.y += height;
    }
    this.y += 14;
  }
  save(attachments: Record<string, string>, title: string): Uint8Array {
    const names: string[] = [];
    for (const [name, content] of Object.entries(attachments)) {
      const bytes = new TextEncoder().encode(content);
      const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('') + '>';
      const mime = name.endsWith('.json') ? 'application#2Fjson' : name.endsWith('.csv') ? 'text#2Fcsv' : 'text#2Fplain';
      const embedded = this.object(`<< /Type /EmbeddedFile /Subtype /${mime} /Params << /Size ${bytes.length} >> /Filter /ASCIIHexDecode /Length ${hex.length} >>\nstream\n${hex}\nendstream`);
      const spec = this.object(`<< /Type /Filespec /F ${literal(name)} /UF ${literal(name)} /EF << /F ${embedded} 0 R >> >>`);
      names.push(`${literal(name)} ${spec} 0 R`);
    }
    this.pages.forEach((page, index) => {
      this.current = page;
      this.text('SIMULATED CHOICES / PERSONAL SESSION REPORT', this.margin, this.pageHeight - 35, 7, false, '0.4 0.44 0.42');
      this.text(`${index + 1} / ${this.pages.length}`, this.pageWidth - 72, this.pageHeight - 35, 8);
      const commands = page.commands.join('\n');
      const stream = this.object(`<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`);
      this.objects[page.ref - 1] = `<< /Type /Page /Parent ${this.pageTree} 0 R /MediaBox [0 0 ${this.pageWidth} ${this.pageHeight}] /Resources << /Font << /F1 ${this.regular} 0 R /F2 ${this.bold} 0 R >> >> /Contents ${stream} 0 R >>`;
    });
    this.objects[this.pageTree - 1] = `<< /Type /Pages /Count ${this.pages.length} /Kids [${this.pages.map(p => `${p.ref} 0 R`).join(' ')}] >>`;
    const catalog = this.object(`<< /Type /Catalog /Pages ${this.pageTree} 0 R /Names << /EmbeddedFiles << /Names [${names.sort().join(' ')}] >> >> >>`);
    const info = this.object(`<< /Title ${literal(title)} /Creator (SECOND NATURE offline report) /Subject (Game results, choice analysis and original session attachments) >>`);
    let result = '%PDF-1.7\n%SECOND-NATURE-REPORT-1\n';
    const offsets = [0];
    this.objects.forEach((body, i) => { offsets.push(result.length); result += `${i + 1} 0 obj\n${body}\nendobj\n`; });
    const xref = result.length;
    result += `xref\n0 ${offsets.length}\n0000000000 65535 f \n` + offsets.slice(1).map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('');
    result += `trailer\n<< /Size ${offsets.length} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    return new TextEncoder().encode(result);
  }
}
