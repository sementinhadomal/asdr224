import { useState, type FormEvent } from 'react';
import { CircleCheck, Download, FileText, Info, Plus, ScanLine, Trash2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import ticketmakerLogo from '@assets/image_1790269694264.png?inline';
import './ticket-generator.css';

type SeatRecord = { id: number; block: string; row: string; seat: string };
type TicketRecord = SeatRecord & { holder: string; ticketNumber: string; qrValue: string };
type EventDetails = { title: string; date: string; venue: string; category: string };

const DEFAULT_EVENT: EventDetails = {
  title: 'J. Cole — The Fall-Off Tour',
  date: '2026-10-25',
  venue: 'Utilita Arena, Birmingham, United Kingdom',
  category: 'Reserved Seating',
};
const newSeat = (id: number): SeatRecord => ({ id, block: '', row: '', seat: '' });

function formatEventDate(dateValue: string) {
  if (!dateValue) return '';
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(date);
}

function createOpaqueId() {
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
    throw new Error('Secure random generation is unavailable in this browser.');
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function ticketNumber(index: number) {
  return `JCF-${createOpaqueId().slice(0, 8)}-${String(index + 1).padStart(2, '0')}`;
}

// PDF coordinates, type sizes, colours, and pagination mirror the standalone Ticketmaker generator.
function drawTicket(
  pdf: jsPDF, ticket: TicketRecord, event: EventDetails, index: number, total: number,
  qrDataUrl: string, logoDataUrl: string,
) {
  const width = 148;
  const height = 210;
  const ink = [1, 92, 207] as const;
  const yellow = [252, 188, 3] as const;
  const soft = [78, 99, 132] as const;
  const line = [239, 218, 154] as const;

  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, width, height, 'F');
  pdf.setDrawColor(...yellow);
  pdf.setLineWidth(0.45);
  pdf.line(12, 12, 25, 12);
  pdf.line(12, 12, 12, 25);
  pdf.line(width - 12, height - 12, width - 25, height - 12);
  pdf.line(width - 12, height - 12, width - 12, height - 25);

  pdf.addImage(logoDataUrl, 'PNG', 98, 14, 32, 8.36);
  pdf.setTextColor(...ink);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.text('EVENT TICKET  /  STAFF ISSUE', 18, 22);
  pdf.setTextColor(...ink);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(19);
  const titleWidth = pdf.getTextWidth(event.title);
  pdf.setFontSize(Math.min(19, Math.max(8, (19 * 76) / titleWidth)));
  pdf.text(event.title, 18, 34);
  pdf.setDrawColor(...ink);
  pdf.setLineWidth(0.35);
  pdf.line(18, 40, 130, 40);

  pdf.setTextColor(...soft);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text('DATE', 18, 49);
  pdf.text('VENUE', 73, 49);
  const formattedDate = formatEventDate(event.date);
  pdf.setTextColor(...ink);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  const dateWidth = pdf.getTextWidth(formattedDate);
  pdf.setFontSize(dateWidth > 50 ? Math.max(6.5, (8.5 * 50) / dateWidth) : 8.5);
  pdf.text(formattedDate, 18, 55);
  pdf.setTextColor(...ink);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text(pdf.splitTextToSize(event.venue, 56).slice(0, 2), 73, 55, { lineHeightFactor: 1.2 });

  pdf.setDrawColor(...line);
  pdf.setLineWidth(0.25);
  pdf.line(18, 68, 130, 68);
  pdf.setTextColor(...soft);
  pdf.setFontSize(7);
  pdf.text('CATEGORY', 18, 77);
  pdf.text('BLOCK', 18, 94);
  pdf.text('ROW', 63, 94);
  pdf.text('SEAT', 104, 94);
  pdf.setTextColor(...ink);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  const categoryWidth = pdf.getTextWidth(event.category);
  pdf.setFontSize(categoryWidth > 112 ? Math.max(7, (11 * 112) / categoryWidth) : 11);
  pdf.text(event.category, 18, 84);
  pdf.setFontSize(16);
  pdf.text(ticket.block || '—', 18, 103);
  pdf.text(ticket.row || '—', 63, 103);
  pdf.text(ticket.seat || '—', 104, 103);

  pdf.setDrawColor(...line);
  pdf.line(18, 113, 130, 113);
  pdf.setTextColor(...soft);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text('TICKET HOLDER', 18, 123);
  pdf.setTextColor(...ink);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(ticket.holder.length > 30 ? 11 : 15);
  pdf.text(ticket.holder, 18, 132, { maxWidth: 112 });

  pdf.addImage(qrDataUrl, 'PNG', 18, 143, 34, 34);
  pdf.setTextColor(...soft);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text('TICKET NUMBER', 64, 150);
  pdf.setTextColor(...ink);
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(8);
  pdf.text(ticket.ticketNumber, 64, 157);
  pdf.setTextColor(...soft);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text(`Ticket ${index + 1} of ${total}`, 64, 164);
  pdf.setDrawColor(...ink);
  pdf.setLineWidth(0.35);
  pdf.line(18, 187, 130, 187);
  pdf.setTextColor(...ink);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.text('ENTRY GUIDANCE', 18, 195);
  pdf.setTextColor(...soft);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text('Please bring this ticket to the venue entrance.', 18, 201);
  pdf.text('Manually generated for staff use.', 18, 205);
}

export default function TicketGenerator() {
  const [holder, setHolder] = useState('');
  const [eventDetails, setEventDetails] = useState(DEFAULT_EVENT);
  const [seats, setSeats] = useState<SeatRecord[]>([newSeat(1)]);
  const [error, setError] = useState('');
  const [holderError, setHolderError] = useState('');
  const [generated, setGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const updateSeat = (id: number, field: keyof Omit<SeatRecord, 'id'>, value: string) => {
    setSeats((current) => current.map((seat) => seat.id === id ? { ...seat, [field]: value } : seat));
    setError('');
    setGenerated(false);
  };
  const updateEvent = (field: keyof EventDetails, value: string) => {
    setEventDetails((current) => ({ ...current, [field]: value }));
    setError('');
    setGenerated(false);
  };
  const addSeat = () => {
    setSeats((current) => [...current, newSeat(Math.max(...current.map((seat) => seat.id), 0) + 1)]);
    setError('');
    setGenerated(false);
  };
  const removeSeat = (id: number) => {
    setSeats((current) => current.length === 1 ? current : current.filter((seat) => seat.id !== id));
    setError('');
    setGenerated(false);
  };
  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedHolder = holder.trim();
    if (!trimmedHolder) {
      setHolderError('Informe o nome do titular.');
      setError('Revise os campos obrigatórios antes de gerar.');
      return;
    }
    setHolderError('');
    const printableEvent = {
      title: eventDetails.title.trim(), date: eventDetails.date,
      venue: eventDetails.venue.trim(), category: eventDetails.category.trim(),
    };
    if (!printableEvent.title || !printableEvent.date || !printableEvent.venue || !printableEvent.category) {
      setError('Preencha evento, data, local e categoria.');
      return;
    }
    if (seats.some((seat) => !seat.block.trim() || !seat.row.trim() || !seat.seat.trim())) {
      setError('Preencha bloco, fila e assento de cada ingresso.');
      return;
    }
    setError('');
    setIsGenerating(true);
    try {
      const tickets: TicketRecord[] = seats.map((seat, index) => ({
        ...seat, block: seat.block.trim(), row: seat.row.trim(), seat: seat.seat.trim(),
        holder: trimmedHolder, ticketNumber: ticketNumber(index), qrValue: createOpaqueId(),
      }));
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
      for (const [index, ticket] of tickets.entries()) {
        if (index > 0) pdf.addPage('a5', 'portrait');
        const qrDataUrl = await QRCode.toDataURL(ticket.qrValue, {
          errorCorrectionLevel: 'M', margin: 1, width: 320,
          color: { dark: '#015ccf', light: '#ffffff' },
        });
        drawTicket(pdf, ticket, printableEvent, index, tickets.length, qrDataUrl, ticketmakerLogo);
      }
      pdf.save(`ticketmaker-${new Date().toISOString().slice(0, 10)}.pdf`);
      setGenerated(true);
    } catch {
      setError('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return <section className="ticket-generator" data-testid="ticket-generator">
    <div className="tg-heading"><div><div className="eyebrow"><span className="eyebrow-square" /> OPERATIONS / MANUAL ISSUE</div><h1>Ticket PDF generator<span className="heading-period">.</span></h1><p>One A5 ticket for each seat, ready to download and print.</p></div><p className="tg-heading-note">Everything stays in this browser session. No ticket or holder information is saved.</p></div>
    <div className="tg-workspace">
      <form className="tg-panel" onSubmit={handleGenerate} noValidate data-testid="form-ticket-generator">
        <div className="tg-panel-head"><div><span className="section-kicker">01 / DETAILS</span><h2>Prepare your tickets</h2><p>One holder, one event, as many seats as you need.</p></div><span className="tg-index">01 / 02</span></div>
        <div className="tg-panel-body">
          <label className="tg-label" htmlFor="tg-holder">Ticket holder <span>*</span></label>
          <input id="tg-holder" className="tg-input" value={holder} onChange={(e) => { setHolder(e.target.value); setHolderError(''); setGenerated(false); }} placeholder="e.g. Mariana Costa" autoComplete="off" maxLength={55} data-testid="input-holder-name" />
          {holderError && <p className="tg-error" data-testid="text-holder-error">{holderError}</p>}
          <div className="tg-event-grid" aria-label="Edit event details">
            <div><label className="tg-label" htmlFor="tg-event">Event <span>*</span></label><input id="tg-event" className="tg-input" value={eventDetails.title} onChange={(e) => updateEvent('title', e.target.value)} maxLength={45} required data-testid="input-event-title" /></div>
            <div><label className="tg-label" htmlFor="tg-date">Date <span>*</span></label><input id="tg-date" className="tg-input" type="date" value={eventDetails.date} onChange={(e) => updateEvent('date', e.target.value)} required data-testid="input-event-date" /></div>
            <div><label className="tg-label" htmlFor="tg-venue">Venue <span>*</span></label><input id="tg-venue" className="tg-input" value={eventDetails.venue} onChange={(e) => updateEvent('venue', e.target.value)} maxLength={70} required data-testid="input-event-venue" /></div>
            <div><label className="tg-label" htmlFor="tg-category">Category <span>*</span></label><input id="tg-category" className="tg-input" value={eventDetails.category} onChange={(e) => updateEvent('category', e.target.value)} maxLength={40} required data-testid="input-event-category" /></div>
          </div>
          <div className="tg-seat-head"><h3>Seats</h3><span className="tg-seat-count" data-testid="text-seat-count">{seats.length} {seats.length === 1 ? 'ticket' : 'tickets'}</span></div>
          <div className="tg-seat-list">{seats.map((seat, index) => <div className="tg-seat-row" key={seat.id} data-testid={`row-seat-${seat.id}`}>
            <div><label className="tg-label" htmlFor={`tg-block-${seat.id}`}>Block <span>*</span></label><input id={`tg-block-${seat.id}`} className="tg-input" value={seat.block} onChange={(e) => updateSeat(seat.id, 'block', e.target.value)} placeholder="e.g. 102" data-testid={`input-block-${seat.id}`} /></div>
            <div><label className="tg-label" htmlFor={`tg-row-${seat.id}`}>Row <span>*</span></label><input id={`tg-row-${seat.id}`} className="tg-input" value={seat.row} onChange={(e) => updateSeat(seat.id, 'row', e.target.value)} placeholder="e.g. F" data-testid={`input-row-${seat.id}`} /></div>
            <div><label className="tg-label" htmlFor={`tg-seat-${seat.id}`}>Seat <span>*</span></label><input id={`tg-seat-${seat.id}`} className="tg-input" value={seat.seat} onChange={(e) => updateSeat(seat.id, 'seat', e.target.value)} placeholder="e.g. 18" data-testid={`input-seat-${seat.id}`} /></div>
            <button type="button" className="tg-remove" aria-label={`Remove seat ${index + 1}`} onClick={() => removeSeat(seat.id)} disabled={seats.length === 1} data-testid={`button-remove-seat-${seat.id}`}><Trash2 size={15}/></button>
          </div>)}</div>
          <button type="button" className="tg-add" onClick={addSeat} data-testid="button-add-seat"><Plus size={15}/> Add another seat</button>
          <div className="tg-note"><Info size={16}/><span>Each QR contains a fresh opaque identifier only. No holder name or seat is encoded. These tickets are for manual staff issue and are not connected to check-in validation.</span></div>
          {error && <p className="tg-error" role="alert" data-testid="text-form-error">{error}</p>}
          <button className="tg-generate" type="submit" disabled={isGenerating} data-testid="button-generate-pdf">{isGenerating ? <><FileText size={17}/> Generating PDF…</> : <><Download size={17}/> Generate & download PDF</>}</button>
          {generated && <div className="tg-success" role="status" data-testid="status-pdf-generated"><CircleCheck size={16}/> PDF downloaded with {seats.length} A5 {seats.length === 1 ? 'page' : 'pages'}.</div>}
        </div>
      </form>
      <section className="tg-panel tg-preview-panel" aria-label="Live ticket preview" data-testid="panel-ticket-preview">
        <div className="tg-panel-head"><div><span className="section-kicker">02 / LIVE PREVIEW</span><h2>The finished ticket</h2></div><span className="tg-index">02 / 02</span></div>
        <div className="tg-preview-stage"><div className="tg-ticket">
          <img className="tg-ticket-logo" src={ticketmakerLogo} alt="Ticketmaker" />
          <div className="tg-ticket-head"><div className="tg-ticket-kicker">Event ticket / staff issue</div><h3 className="tg-ticket-title" data-testid="preview-event-title">{eventDetails.title}</h3><p className="tg-ticket-detail" data-testid="preview-event-date">{formatEventDate(eventDetails.date)}</p><p className="tg-ticket-detail" data-testid="preview-event-venue">{eventDetails.venue}</p><p className="tg-ticket-category" data-testid="preview-event-category">{eventDetails.category}</p></div>
          <div className="tg-ticket-seats"><div><span>Block</span><strong data-testid="preview-block">{seats[0]?.block || '—'}</strong></div><div><span>Row</span><strong data-testid="preview-row">{seats[0]?.row || '—'}</strong></div><div><span>Seat</span><strong data-testid="preview-seat">{seats[0]?.seat || '—'}</strong></div></div>
          <div className="tg-ticket-holder"><span>Ticket holder</span><strong data-testid="preview-holder">{holder.trim() || 'Holder name'}</strong></div>
          <div className="tg-qr-area"><div className="tg-qr" aria-label="Illustrative QR code, not a scannable ticket"><div className="tg-qr-grid">{Array.from({ length: 49 }, (_, index) => <i key={index}/>)}</div></div><div className="tg-ticket-number">Ticket number<strong>JCF-XXXXXX-01</strong></div></div>
          <div className="tg-ticket-guidance"><strong>Entry guidance</strong><br/>Please bring this ticket to the venue entrance.</div>
        </div></div>
        <div className="tg-preview-foot"><div className="tg-preview-meta"><span>PDF output</span><strong data-testid="text-pdf-page-count">A5 · {seats.length} {seats.length === 1 ? 'page' : 'pages'}</strong></div><div className="tg-preview-caveat"><ScanLine size={15}/><span>Preview shows the first seat. Each seat receives its own page and unique QR identifier.</span></div></div>
      </section>
    </div>
  </section>;
}