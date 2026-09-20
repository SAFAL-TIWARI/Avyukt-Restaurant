import { jsPDF } from 'jspdf';

// Helper to convert number to words (Indian numbering system)
const numberToWords = (num) => {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if (n === 0) return '';
    if (n < 20) return a[n] + ' ';
    if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10] + ' ';
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred ' + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand ' + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh ' + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + ' Crore ' + inWords(n % 10000000);
  };

  const integerPart = Math.floor(num);
  const words = inWords(integerPart).trim();
  return words ? `Rupees ${words} Only` : 'Rupees Zero Only';
};

export const downloadOrderReceipt = (order) => {
  if (!order) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const leftMargin = 16;
  const rightMargin = pageWidth - 16;
  let y = 16;

  // 1. Header Banner & Restaurant Branding
  doc.setFillColor(128, 0, 0); // Royal Maroon
  doc.rect(14, y, pageWidth - 28, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.text('AVYUKT RESTAURANT & CAFE', pageWidth / 2, y + 9, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Authentic Flavours • Modern Ambience • 100% Pure Vegetarian', pageWidth / 2, y + 15, { align: 'center' });
  doc.text('Hotel Grand Ashok, 3rd Floor, Kundan Complex, Shehnai Garden, Vidisha (M.P.) - 464001', pageWidth / 2, y + 20, { align: 'center' });

  y += 30;

  // 2. Tax Information Strip
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('GSTIN: 23AALCA1248K1ZS', leftMargin, y);
  doc.text('FSSAI Lic. No: 11421850000342', pageWidth / 2, y, { align: 'center' });
  doc.text('Ph: +91 9039121277 / 8319670523', rightMargin, y, { align: 'right' });

  y += 3;
  doc.setDrawColor(210, 210, 210);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(leftMargin, y, rightMargin, y);
  doc.setLineDashPattern([], 0);

  y += 7;

  // 3. Invoice Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(128, 0, 0);
  doc.text('TAX INVOICE / CASH BILL', pageWidth / 2, y, { align: 'center' });

  y += 7;

  // 4. Invoice Details Box
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(leftMargin, y, pageWidth - 32, 28, 2, 2, 'F');
  doc.setDrawColor(225, 225, 225);
  doc.roundedRect(leftMargin, y, pageWidth - 32, 28, 2, 2, 'D');

  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  // Left Column (Invoice info)
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice / Order No:', leftMargin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(order.id || 'N/A', leftMargin + 38, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Order Date & Time:', leftMargin + 4, y + 13);
  doc.setFont('helvetica', 'normal');
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  }) : 'Recently';
  doc.text(dateStr, leftMargin + 38, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('Payment Status:', leftMargin + 4, y + 20);
  const isPaid = order.paymentStatus === 'paid' || order.amountReceivedByAdmin;
  doc.setFont('helvetica', 'bold');
  if (isPaid) {
    doc.setTextColor(5, 150, 105);
  } else {
    doc.setTextColor(217, 119, 6);
  }
  doc.text(isPaid ? 'PAID (Verified)' : 'PAYMENT PENDING', leftMargin + 38, y + 20);
  doc.setTextColor(50, 50, 50);

  // Right Column (Customer info)
  const rightColX = pageWidth / 2 + 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Name:', rightColX, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(order.customerName || 'Valued Guest', rightColX + 32, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Contact Mobile:', rightColX, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(order.customerPhone || 'N/A', rightColX + 32, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('Payment Method:', rightColX, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(order.paymentMethod === 'razorpay' ? 'Razorpay Online (Prepaid)' : 'Cash / Direct UPI', rightColX + 32, y + 20);

  y += 33;

  // Delivery Address Row
  if (order.deliveryAddress) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Delivery Address: ', leftMargin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(order.deliveryAddress.substring(0, 95), leftMargin + 28, y);
    y += 6;
  }

  y += 2;

  // 5. Itemized Table Header
  doc.setFillColor(242, 237, 237);
  doc.rect(leftMargin, y, pageWidth - 32, 7, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.line(leftMargin, y, rightMargin, y);
  doc.line(leftMargin, y + 7, rightMargin, y + 7);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(70, 70, 70);
  doc.text('S.No', leftMargin + 2, y + 4.8);
  doc.text('Item Description', leftMargin + 14, y + 4.8);
  doc.text('Qty', rightMargin - 48, y + 4.8, { align: 'center' });
  doc.text('Rate (Rs)', rightMargin - 26, y + 4.8, { align: 'right' });
  doc.text('Amount (Rs)', rightMargin - 2, y + 4.8, { align: 'right' });

  y += 10;

  // 6. Items Listing
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);

  const items = order.items || [];
  let computedSubtotal = 0;

  items.forEach((item, index) => {
    const qty = item.quantity || 1;
    const price = item.price || 0;
    const lineTotal = qty * price;
    computedSubtotal += lineTotal;

    doc.text(`${index + 1}.`, leftMargin + 2, y);
    const itemName = item.name || item.title || 'Special Dish';
    doc.text(itemName.substring(0, 42), leftMargin + 14, y);
    doc.text(`${qty}`, rightMargin - 48, y, { align: 'center' });
    doc.text(`${price.toFixed(2)}`, rightMargin - 26, y, { align: 'right' });
    doc.text(`${lineTotal.toFixed(2)}`, rightMargin - 2, y, { align: 'right' });

    y += 6.5;

    // Page break protection if order has 15+ items
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
  });

  // Table bottom border
  doc.setDrawColor(210, 210, 210);
  doc.line(leftMargin, y, rightMargin, y);
  y += 4;

  // 7. Calculations Breakdown
  const subtotal = order.subtotal !== undefined ? order.subtotal : computedSubtotal;
  const deliveryFee = order.deliveryFee !== undefined ? order.deliveryFee : 0;
  const tax = order.tax !== undefined ? order.tax : (subtotal * 0.05);
  const cgst = tax / 2;
  const sgst = tax / 2;
  const grandTotal = order.totalAmount || (subtotal + deliveryFee + tax);

  const calcXLabel = rightMargin - 70;
  const calcXVal = rightMargin - 2;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);

  doc.text('Subtotal:', calcXLabel, y);
  doc.text(`Rs ${subtotal.toFixed(2)}`, calcXVal, y, { align: 'right' });
  y += 5;

  if (deliveryFee > 0) {
    doc.text('Delivery Charges:', calcXLabel, y);
    doc.text(`Rs ${deliveryFee.toFixed(2)}`, calcXVal, y, { align: 'right' });
    y += 5;
  } else {
    doc.text('Delivery Charges:', calcXLabel, y);
    doc.text('FREE', calcXVal, y, { align: 'right' });
    y += 5;
  }

  doc.text('CGST (2.5%):', calcXLabel, y);
  doc.text(`Rs ${cgst.toFixed(2)}`, calcXVal, y, { align: 'right' });
  y += 5;

  doc.text('SGST (2.5%):', calcXLabel, y);
  doc.text(`Rs ${sgst.toFixed(2)}`, calcXVal, y, { align: 'right' });
  y += 5.5;

  // Total Divider & Grand Total
  doc.setDrawColor(128, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(calcXLabel - 4, y, rightMargin, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(128, 0, 0);
  doc.text('GRAND TOTAL:', calcXLabel, y);
  doc.text(`Rs ${grandTotal.toFixed(2)}`, calcXVal, y, { align: 'right' });

  doc.setLineWidth(0.2);
  y += 6;
  doc.line(calcXLabel - 4, y, rightMargin, y);

  y += 6;

  // Amount in Words
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('Amount in Words:', leftMargin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(numberToWords(grandTotal), leftMargin + 30, y);

  y += 12;

  // 8. Footer & Terms
  doc.setDrawColor(220, 220, 220);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(leftMargin, y, rightMargin, y);
  doc.setLineDashPattern([], 0);

  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for dining with Avyukt Restaurant! We hope you loved your royal meal.', pageWidth / 2, y, { align: 'center' });
  doc.text('For queries or event bookings: +91 9039121277 • rahul.baghel76@gmail.com', pageWidth / 2, y + 4.5, { align: 'center' });
  doc.text('** This is a computer-generated tax invoice and does not require physical signature **', pageWidth / 2, y + 9, { align: 'center' });

  // Save the PDF
  const filename = `Avyukt_Receipt_${order.id || 'Order'}.pdf`;
  doc.save(filename);
};
