import jsPDF from 'jspdf';

interface PDFExportOptions {
    title: string;
    content: string;
    author?: string;
}

export function exportToPDF({ title, content, author = 'METIS Author' }: PDFExportOptions) {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Page settings
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Helper to add new page if needed
    const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
        }
    };

    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(title, maxWidth);
    titleLines.forEach((line: string) => {
        checkPageBreak(12);
        doc.text(line, margin, yPosition);
        yPosition += 12;
    });

    yPosition += 10;

    // Process Markdown content
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip empty lines (but add spacing)
        if (line.trim() === '') {
            yPosition += 3;
            continue;
        }

        // Headings
        if (line.startsWith('# ')) {
            checkPageBreak(10);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text(line.substring(2), margin, yPosition);
            yPosition += 10;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            continue;
        }

        if (line.startsWith('## ')) {
            checkPageBreak(8);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(line.substring(3), margin, yPosition);
            yPosition += 8;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            continue;
        }

        if (line.startsWith('### ')) {
            checkPageBreak(7);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(line.substring(4), margin, yPosition);
            yPosition += 7;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            continue;
        }

        // Quotes
        if (line.startsWith('> ')) {
            checkPageBreak(6);
            doc.setFont('helvetica', 'italic');
            const quoteText = line.substring(2);
            const wrappedQuote = doc.splitTextToSize(quoteText, maxWidth - 10);
            wrappedQuote.forEach((quoteLine: string) => {
                checkPageBreak(6);
                doc.text(quoteLine, margin + 10, yPosition);
                yPosition += 6;
            });
            doc.setFont('helvetica', 'normal');
            continue;
        }

        // Lists
        if (line.match(/^[\-\*]\s/)) {
            checkPageBreak(6);
            const listText = line.substring(2);
            const wrappedList = doc.splitTextToSize('• ' + listText, maxWidth - 5);
            wrappedList.forEach((listLine: string) => {
                checkPageBreak(6);
                doc.text(listLine, margin + 5, yPosition);
                yPosition += 6;
            });
            continue;
        }

        // Regular paragraphs
        const wrappedText = doc.splitTextToSize(line, maxWidth);
        wrappedText.forEach((textLine: string) => {
            checkPageBreak(6);
            doc.text(textLine, margin, yPosition);
            yPosition += 6;
        });
    }

    // Footer with page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Seite ${i} von ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${title.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.pdf`;

    // Save
    doc.save(filename);
}
