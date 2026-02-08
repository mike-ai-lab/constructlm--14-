import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export const parsePDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items with spaces
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    const trimmedText = fullText.trim();
    
    // Validate extracted text - check if it's mostly readable
    if (!trimmedText || trimmedText.length < 50) {
      throw new Error('PDF appears to be empty or unreadable');
    }
    
    // Check if text is mostly binary/encoded (more than 30% non-printable chars)
    const nonPrintableCount = (trimmedText.match(/[^\x20-\x7E\n\r\t]/g) || []).length;
    const nonPrintableRatio = nonPrintableCount / trimmedText.length;
    
    if (nonPrintableRatio > 0.3) {
      console.warn('PDF contains high ratio of non-printable characters:', nonPrintableRatio);
      throw new Error('PDF text extraction failed - file may be scanned or encrypted');
    }
    
    console.log(`✅ PDF parsed: ${pdf.numPages} pages, ${trimmedText.length} characters`);
    return trimmedText;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
