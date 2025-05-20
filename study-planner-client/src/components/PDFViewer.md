# PDF.js Express Setup Instructions

## Overview
This application uses PDF.js Express for rendering PDF documents in-browser, avoiding issues with Content-Disposition headers.

## Complete Setup Instructions

### 1. Download Assets
Visit [https://pdfjs.express/download](https://pdfjs.express/download) and download the full viewer assets.

### 2. Extract Assets
Extract the contents of the downloaded ZIP file and place the entire folder in your public directory:
```
public/pdfjs-express/
```

The directory structure should look like this:
```
public/pdfjs-express/
├── core/
├── ui/
├── pdf/
├── webviewer.min.js
├── webviewer-core.min.js
├── webviewer-ui.min.js
└── ... other files
```

### 3. Restart Development Server
After placing the assets, restart your development server to see the changes take effect.

### 4. Testing
Verify that PDF documents are rendering properly in the following browsers:
- Chrome
- Firefox
- Safari
- Edge

PDFs should render inline without downloading, even when Cloudinary's headers indicate attachment.

## Troubleshooting

### PDFs Not Loading
- Ensure all assets are correctly placed in the public/pdfjs-express directory
- Check browser console for any errors
- Verify that the PDF URL is publicly accessible
- Try clearing browser cache

### Viewer UI Issues
If the viewer UI looks incorrect:
- Make sure you downloaded the full assets, not just the core library
- Check that CSS is properly loaded
- Verify the path is correct (should be "/pdfjs-express")

## License
Note that PDF.js Express may require a license for production use. Visit [https://pdfjs.express](https://pdfjs.express) for more information. 