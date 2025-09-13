"use client";

interface ExportPDFProps {
  summary: string;
  originalText?: string;
  summaryMode: string;
  fileName?: string;
}

export function exportToPDF({ summary, originalText, summaryMode, fileName = 'tom-tat' }: ExportPDFProps) {
  // Create a simple HTML structure for the PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>AI Tóm tắt - ${fileName}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          margin: 40px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #4F46E5;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .title {
          color: #4F46E5;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #666;
          font-size: 14px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #4F46E5;
          margin-bottom: 15px;
          border-left: 4px solid #4F46E5;
          padding-left: 15px;
        }
        .content {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #e9ecef;
          white-space: pre-wrap;
        }
        .summary-mode {
          display: inline-block;
          background-color: #4F46E5;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          margin-bottom: 15px;
        }
        .footer {
          text-align: center;
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          color: #666;
          font-size: 12px;
        }
        .date {
          color: #999;
          font-size: 12px;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">AI Tóm tắt văn bản</div>
        <div class="subtitle">Công cụ tóm tắt thông minh cho người Việt</div>
        <div class="date">Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}</div>
      </div>

      <div class="section">
        <div class="section-title">Kết quả tóm tắt</div>
        <div class="summary-mode">${getSummaryModeLabel(summaryMode)}</div>
        <div class="content">${summary}</div>
      </div>

      ${originalText ? `
      <div class="section">
        <div class="section-title">Văn bản gốc</div>
        <div class="content">${originalText.substring(0, 3000)}${originalText.length > 3000 ? '\n\n[Văn bản được rút gọn do giới hạn độ dài]' : ''}</div>
      </div>
      ` : ''}

      <div class="footer">
        <div>Được tạo bởi AI Tóm tắt - ai-tomtat.com</div>
        <div>Công cụ tóm tắt văn bản thông minh cho người Việt</div>
      </div>
    </body>
    </html>
  `;

  // Create a new window with the content
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
      printWindow.focus();
      printWindow.print();
      
      // Close the window after printing
      setTimeout(() => {
        printWindow.close();
      }, 100);
    };
  }
}

function getSummaryModeLabel(mode: string): string {
  switch (mode) {
    case 'short': return 'Tóm tắt ngắn';
    case 'bullet': return 'Điểm chính';
    case 'outline': return 'Dàn ý';
    default: return 'Tóm tắt';
  }
}

// Alternative: Download as HTML file
export function downloadAsHTML({ summary, originalText, summaryMode, fileName = 'tom-tat' }: ExportPDFProps) {
  const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Tóm tắt - ${fileName}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 40px;
      background-color: #f8f9fa;
      color: #333;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #4F46E5;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .title {
      color: #4F46E5;
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #666;
      font-size: 16px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 20px;
      font-weight: bold;
      color: #4F46E5;
      margin-bottom: 15px;
      border-left: 4px solid #4F46E5;
      padding-left: 15px;
    }
    .content {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e9ecef;
      white-space: pre-wrap;
    }
    .summary-mode {
      display: inline-block;
      background: linear-gradient(135deg, #4F46E5, #7C3AED);
      color: white;
      padding: 6px 16px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 15px;
    }
    .footer {
      text-align: center;
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e9ecef;
      color: #666;
    }
    .date {
      color: #999;
      font-size: 14px;
      margin-bottom: 10px;
    }
    @media print {
      body { background: white; padding: 20px; }
      .container { box-shadow: none; padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">🤖 AI Tóm tắt văn bản</div>
      <div class="subtitle">Công cụ tóm tắt thông minh cho người Việt</div>
      <div class="date">📅 Ngày tạo: ${new Date().toLocaleDateString('vi-VN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}</div>
    </div>

    <div class="section">
      <div class="section-title">📝 Kết quả tóm tắt</div>
      <div class="summary-mode">${getSummaryModeLabel(summaryMode)}</div>
      <div class="content">${summary}</div>
    </div>

    ${originalText ? `
    <div class="section">
      <div class="section-title">📄 Văn bản gốc</div>
      <div class="content">${originalText.length > 5000 ? 
        originalText.substring(0, 5000) + '\n\n📄 [Văn bản được rút gọn do giới hạn độ dài. Vui lòng tham khảo file gốc để xem toàn bộ nội dung.]'
        : originalText}</div>
    </div>
    ` : ''}

    <div class="footer">
      <div style="font-size: 16px; margin-bottom: 10px;">
        <strong>🌟 AI Tóm tắt - ai-tomtat.com</strong>
      </div>
      <div>Công cụ tóm tắt văn bản thông minh cho người Việt</div>
      <div style="margin-top: 10px; font-size: 12px;">
        💡 Nhanh - Đơn giản - Tiện lợi
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
