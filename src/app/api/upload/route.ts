import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF and DOCX files are supported.' }, { status: 400 });
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size too large. Maximum size is 10MB.' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    let extractedText = '';

    try {
      if (file.type === 'application/pdf') {
        extractedText = `PDF file "${file.name}" (${Math.round(file.size / 1024)}KB) was uploaded successfully. 

📋 To summarize your PDF content:
1. Open the PDF file on your device
2. Copy the text you want to summarize
3. Paste it in the "Text Input" tab
4. Click "Tóm tắt" to generate your summary

💡 Full PDF text extraction will be available in the next update!`;

      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        extractedText = `DOCX file "${file.name}" (${Math.round(file.size / 1024)}KB) was uploaded successfully.

📋 To summarize your Word document:
1. Open the document on your device
2. Copy the text you want to summarize
3. Paste it in the "Text Input" tab
4. Click "Tóm tắt" to generate your summary

💡 Full DOCX text extraction will be available in the next update!`;
      }
    } catch (parseError) {
      console.error('Error extracting text:', parseError);
      
      // Fallback: return a basic response indicating the file was received
      extractedText = `Unable to extract text from ${file.name}. Please try a different file or contact support.`;
    }

    // For informational responses, we don't need text validation
    // The user will manually copy-paste the content

    // Limit text length for processing
    const maxTextLength = 50000; // 50k characters
    if (extractedText.length > maxTextLength) {
      extractedText = extractedText.substring(0, maxTextLength) + '\n\n[Text truncated due to length limit]';
    }

    return NextResponse.json({ 
      success: true, 
      text: extractedText,
      fileName: file.name,
      fileSize: file.size,
      textLength: extractedText.length
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
