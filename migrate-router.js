const fs = require('fs');
const path = require('path');

// Files to update
const filesToUpdate = [
  'src/components/Footer.tsx',
  'src/components/Navbar.tsx', 
  'src/components/EnhancedNavbar.tsx',
  'src/components/ProtectedRoute.tsx',
  'src/pages/Cart.tsx',
  'src/pages/Privacy.tsx',
  'src/pages/Register.tsx',
  'src/pages/Checkout.tsx',
  'src/pages/Index.tsx',
  'src/pages/Contact.tsx',
  'src/pages/Login.tsx',
  'src/pages/Terms.tsx',
  'src/pages/CustomOrder.tsx',
  'src/pages/FAQ.tsx',
  'src/pages/Account.tsx',
  'src/pages/NotFound.tsx',
  'src/pages/Bundles.tsx',
  'src/pages/EmailConfirmation.tsx',
  'src/pages/OrderTracking.tsx',
  'src/pages/ForgotPassword.tsx'
];

// Replace patterns
const replacements = [
  // Simple Link import
  {
    from: /import \{ Link \} from ["']react-router-dom["'];/g,
    to: 'import Link from "next/link";'
  },
  // useNavigate and Link import
  {
    from: /import \{ useNavigate, Link \} from ["']react-router-dom["'];/g,
    to: 'import Link from "next/link";\nimport { useRouter } from "next/router";'
  },
  // useLocation and useNavigate import
  {
    from: /import \{ Link, useLocation, useNavigate \} from ["']react-router-dom["'];/g,
    to: 'import Link from "next/link";\nimport { useRouter } from "next/router";'
  },
  // useSearchParams and useNavigate import
  {
    from: /import \{ useNavigate, useSearchParams, Link \} from ["']react-router-dom["'];/g,
    to: 'import Link from "next/link";\nimport { useRouter } from "next/router";'
  },
  // Other combinations
  {
    from: /import \{ useNavigate \} from ["']react-router-dom["'];/g,
    to: 'import { useRouter } from "next/router";'
  },
  {
    from: /import \{ Navigate \} from ["']react-router-dom["'];/g,
    to: 'import { useRouter } from "next/router";'
  },
  {
    from: /import \{ useLocation \} from ["']react-router-dom["'];/g,
    to: 'import { useRouter } from "next/router";'
  },
  {
    from: /import \{ Link, useParams \} from ["']react-router-dom["'];/g,
    to: 'import Link from "next/link";\nimport { useRouter } from "next/router";'
  }
];

// Function to update a file
function updateFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    for (const replacement of replacements) {
      if (replacement.from.test(content)) {
        content = content.replace(replacement.from, replacement.to);
        updated = true;
      }
    }

    // Handle useNavigate function calls
    if (content.includes('useNavigate(')) {
      content = content.replace(/const navigate = useNavigate\(\);/g, 'const router = useRouter();');
      content = content.replace(/navigate\(/g, 'router.push(');
      updated = true;
    }

    // Handle useLocation calls
    if (content.includes('useLocation(')) {
      content = content.replace(/const location = useLocation\(\);/g, 'const router = useRouter();');
      content = content.replace(/location\.pathname/g, 'router.pathname');
      updated = true;
    }

    // Handle useParams calls  
    if (content.includes('useParams(')) {
      content = content.replace(/const \{ ([^}]+) \} = useParams\(\);/g, 'const router = useRouter();\n  const { $1 } = router.query;');
      updated = true;
    }

    // Handle Navigate component usage
    if (content.includes('<Navigate')) {
      content = content.replace(/<Navigate to="([^"]+)" replace \/>/g, (match, to) => {
        return `useEffect(() => { router.replace('${to}'); }, [router]);`;
      });
      updated = true;
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Run updates
console.log('Starting React Router to Next.js migration...');
for (const file of filesToUpdate) {
  updateFile(file);
}
console.log('Migration complete!');
