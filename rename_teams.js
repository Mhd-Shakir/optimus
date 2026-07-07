const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // UI text replacements
    content = content.replace(/Team Auris/g, 'Team A');
    content = content.replace(/Team Libras/g, 'Team B');
    
    // Code logic replacements
    content = content.replace(/\"Auris\"/g, '"Team A"');
    content = content.replace(/\"Libras\"/g, '"Team B"');
    content = content.replace(/'Auris'/g, "'Team A'");
    content = content.replace(/'Libras'/g, "'Team B'");
    
    // Specific property replacements
    content = content.replace(/ Auris:/g, ' "Team A":');
    content = content.replace(/ Libras:/g, ' "Team B":');
    content = content.replace(/\.Auris/g, '["Team A"]');
    content = content.replace(/\.Libras/g, '["Team B"]');
    
    // Auth role text replacements
    content = content.replace(/Auris Team/g, 'Team A');
    content = content.replace(/Libras Team/g, 'Team B');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', filePath);
    }
}

const files = [
    'lib/types.ts',
    'app/students/page.tsx',
    'app/middleware.ts',
    'app/events/page.tsx',
    'app/dashboard/page.tsx',
    'app/api/seed/route.ts',
    'app/admin/students/page.tsx',
    'app/admin/stage/page.tsx',
    'app/admin/registrations/page.tsx',
    'app/admin/page.tsx',
    'app/admin/events/page.tsx',
    'app/api/events/route.ts',
    'app/api/events/result/route.ts',
    'app/api/dashboard/stats/route.ts'
];

files.forEach(f => replaceInFile(path.join(process.cwd(), f)));
