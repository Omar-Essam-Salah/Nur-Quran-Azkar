import { toast } from 'sonner';

// Render an ayah to a beautiful image card and share it (Web Share API with a
// file when available, otherwise download / copy). No dependencies, no assets.
interface CardData { arabic: string; translation: string; reference: string }

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = (text || '').split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (line && ctx.measureText(test).width > maxWidth) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export async function shareVerseCard({ arabic, translation, reference }: CardData): Promise<void> {
  try {
    // Make sure the Arabic font is ready before measuring/drawing.
    try { await (document as any).fonts?.load?.('60px Amiri'); await (document as any).fonts?.ready; } catch { /* ignore */ }

    const W = 1080, H = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no ctx');

    // Background.
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0c2f44');
    bg.addColorStop(1, '#07151d');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // Gold double frame.
    ctx.strokeStyle = 'rgba(212,175,55,0.5)'; ctx.lineWidth = 4;
    ctx.strokeRect(46, 46, W - 92, H - 92);
    ctx.strokeStyle = 'rgba(212,175,55,0.25)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(58, 58, W - 116, H - 116);

    ctx.textAlign = 'center';

    // Measure blocks.
    const arSize = arabic.length > 220 ? 44 : arabic.length > 120 ? 52 : 60;
    ctx.font = `${arSize}px "Amiri", serif`;
    ctx.direction = 'rtl';
    const arLines = wrapLines(ctx, arabic, W - 230);
    const arLineH = arSize * 1.85;

    ctx.font = '30px "Inter", system-ui, sans-serif';
    ctx.direction = 'ltr';
    const trLines = translation ? wrapLines(ctx, translation, W - 240) : [];
    const trLineH = 44;

    const dividerGap = 56;
    const total = arLines.length * arLineH + (trLines.length ? dividerGap + trLines.length * trLineH : 0);
    let y = (H - total) / 2 + arSize;

    // Arabic.
    ctx.fillStyle = '#ffffff';
    ctx.font = `${arSize}px "Amiri", serif`;
    ctx.direction = 'rtl';
    for (const ln of arLines) { ctx.fillText(ln, W / 2, y); y += arLineH; }

    // Divider + translation.
    if (trLines.length) {
      y += dividerGap - arLineH + arSize;
      ctx.strokeStyle = 'rgba(212,175,55,0.4)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W / 2 - 70, y - 34); ctx.lineTo(W / 2 + 70, y - 34); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.78)';
      ctx.font = '30px "Inter", system-ui, sans-serif';
      ctx.direction = 'ltr';
      for (const ln of trLines) { ctx.fillText(ln, W / 2, y); y += trLineH; }
    }

    // Reference (gold).
    ctx.fillStyle = '#d4af37';
    ctx.font = '30px "Amiri", serif';
    ctx.direction = 'rtl';
    ctx.fillText(reference, W / 2, H - 150);

    // Branding.
    ctx.fillStyle = 'rgba(212,175,55,0.95)';
    ctx.font = 'bold 40px "Amiri", serif';
    ctx.fillText('نُور', W / 2, H - 88);

    const blob: Blob = await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('no blob'))), 'image/png', 0.95));

    // Preferred: native share sheet with the image file.
    const nav = navigator as any;
    const file = new File([blob], 'nur-ayah.png', { type: 'image/png' });
    if (nav.canShare && nav.canShare({ files: [file] })) {
      await nav.share({ files: [file], title: 'نُور', text: reference });
      return;
    }
    // Fallback: download the image.
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'nur-ayah.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    toast('تم حفظ صورة الآية', { description: 'شاركها من معرض الصور 🤍' });
  } catch {
    try { await navigator.clipboard.writeText(`${arabic}\n\n${translation}\n${reference}`); toast('تم نسخ الآية'); }
    catch { /* ignore */ }
  }
}
