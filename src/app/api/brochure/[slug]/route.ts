import { NextRequest, NextResponse } from 'next/server';
import { getListingBySlug } from '@/lib/supabase';
import { formatPrice, formatSqft, formatLeaseRate, transactionLabel, propertyTypeLabel } from '@/lib/utils';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const listing = await getListingBySlug(slug);

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('CRECO', 20, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text('Commercial Real Estate Company', 20, 30);
    doc.text('(210) 817-3443  |  info@crecotx.com  |  crecotx.com', 20, 35);
    doc.setTextColor(0);

    // Divider
    doc.setDrawColor(201, 169, 98);
    doc.setLineWidth(0.5);
    doc.line(20, 38, 190, 38);

    // Property Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(listing.title, 20, 50);

    // Address
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`${listing.address}, ${listing.city}, ${listing.state} ${listing.zip ?? ''}`.trim(), 20, 58);
    if (listing.submarket) {
      doc.setTextColor(120);
      doc.text(`Submarket: ${listing.submarket}`, 20, 64);
      doc.setTextColor(0);
    }

    // Tags
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`${transactionLabel(listing.transaction_type)}  ·  ${propertyTypeLabel(listing.property_type)}`, 20, 70);
    doc.setTextColor(0);

    // Price / Rate
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(201, 169, 98);
    const priceLine = listing.transaction_type === 'sale' && listing.sale_price
      ? formatPrice(listing.sale_price)
      : listing.lease_rate
        ? formatLeaseRate(listing.lease_rate, listing.lease_rate_basis)
        : 'Contact for pricing';
    doc.text(priceLine, 20, 82);
    doc.setTextColor(0);

    // Key Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Property Details', 20, 96);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const details = [
      `Building Size: ${formatSqft(listing.sqft)}`,
      listing.available_sqft != null ? `Available: ${formatSqft(listing.available_sqft)}` : '',
      listing.lot_size != null ? `Lot Size: ${listing.lot_size} ac` : '',
      listing.zoning ? `Zoning: ${listing.zoning}` : '',
      listing.year_built ? `Year Built: ${listing.year_built}` : '',
      listing.clear_height ? `Clear Height: ${listing.clear_height}'` : '',
      listing.dock_doors != null ? `Dock Doors: ${listing.dock_doors}` : '',
      listing.grade_doors != null ? `Grade Doors: ${listing.grade_doors}` : '',
    ].filter(Boolean);

    details.forEach((d, i) => {
      doc.text(d, 20 + (i % 2) * 90, 106 + Math.floor(i / 2) * 7);
    });

    // Description
    if (listing.description) {
      const yPos = 106 + Math.ceil(details.length / 2) * 7 + 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('About This Property', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(listing.description, 170);
      doc.text(lines, 20, yPos + 8);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      'CRECO – Commercial Real Estate Company  ·  San Antonio, TX  ·  Licensed Texas Real Estate Brokerage',
      105,
      265,
      { align: 'center' }
    );

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${slug}-brochure.pdf"`,
      },
    });
  } catch (err) {
    console.error('Brochure generation error:', err);
    return NextResponse.json({ error: 'Failed to generate brochure' }, { status: 500 });
  }
}
