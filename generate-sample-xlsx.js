const XLSX = require('xlsx');

// Sample threat intelligence data
const threatData = [
  {
    'Threat_ID': 'THR-2024-001',
    'Threat_Type': 'Malware',
    'Indicator': '192.168.1.100',
    'Indicator_Type': 'IPv4',
    'Severity': 'High',
    'Confidence': '85',
    'First_Seen': '2024-01-15',
    'Last_Seen': '2024-01-20',
    'Source': 'Internal Detection',
    'Description': 'Suspicious C2 communication detected',
    'Tags': 'botnet,c2,malicious-ip'
  },
  {
    'Threat_ID': 'THR-2024-002',
    'Threat_Type': 'Phishing',
    'Indicator': 'malicious-site.com',
    'Indicator_Type': 'Domain',
    'Severity': 'Critical',
    'Confidence': '95',
    'First_Seen': '2024-01-16',
    'Last_Seen': '2024-01-22',
    'Source': 'Threat Feed',
    'Description': 'Phishing campaign targeting financial institutions',
    'Tags': 'phishing,credential-theft,financial'
  },
  {
    'Threat_ID': 'THR-2024-003',
    'Threat_Type': 'Malware',
    'Indicator': 'a3f5e8d9c2b1a4f6e7d8c9b0a1f2e3d4',
    'Indicator_Type': 'MD5',
    'Severity': 'High',
    'Confidence': '90',
    'First_Seen': '2024-01-17',
    'Last_Seen': '2024-01-23',
    'Source': 'Sandbox Analysis',
    'Description': 'Ransomware variant detected in sandbox',
    'Tags': 'ransomware,encryption,malware'
  },
  {
    'Threat_ID': 'THR-2024-004',
    'Threat_Type': 'Exploit',
    'Indicator': 'CVE-2024-1234',
    'Indicator_Type': 'CVE',
    'Severity': 'Critical',
    'Confidence': '100',
    'First_Seen': '2024-01-18',
    'Last_Seen': '2024-01-24',
    'Source': 'Vulnerability Database',
    'Description': 'Zero-day exploit in web server software',
    'Tags': 'zero-day,rce,critical'
  },
  {
    'Threat_ID': 'THR-2024-005',
    'Threat_Type': 'Malware',
    'Indicator': '10.20.30.40',
    'Indicator_Type': 'IPv4',
    'Severity': 'Medium',
    'Confidence': '70',
    'First_Seen': '2024-01-19',
    'Last_Seen': '2024-01-25',
    'Source': 'Network Monitoring',
    'Description': 'Suspicious outbound traffic pattern',
    'Tags': 'data-exfiltration,suspicious'
  },
  {
    'Threat_ID': 'THR-2024-006',
    'Threat_Type': 'Phishing',
    'Indicator': 'attacker@evil-domain.net',
    'Indicator_Type': 'Email',
    'Severity': 'High',
    'Confidence': '88',
    'First_Seen': '2024-01-20',
    'Last_Seen': '2024-01-26',
    'Source': 'Email Gateway',
    'Description': 'Spear phishing campaign targeting executives',
    'Tags': 'spear-phishing,social-engineering'
  },
  {
    'Threat_ID': 'THR-2024-007',
    'Threat_Type': 'Malware',
    'Indicator': 'b4e6f9a2d3c5e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
    'Indicator_Type': 'SHA1',
    'Severity': 'High',
    'Confidence': '92',
    'First_Seen': '2024-01-21',
    'Last_Seen': '2024-01-27',
    'Source': 'Antivirus Detection',
    'Description': 'Trojan downloader identified',
    'Tags': 'trojan,downloader,malware'
  },
  {
    'Threat_ID': 'THR-2024-008',
    'Threat_Type': 'APT',
    'Indicator': '203.0.113.50',
    'Indicator_Type': 'IPv4',
    'Severity': 'Critical',
    'Confidence': '98',
    'First_Seen': '2024-01-22',
    'Last_Seen': '2024-01-28',
    'Source': 'Threat Intelligence',
    'Description': 'APT group infrastructure identified',
    'Tags': 'apt,nation-state,targeted-attack'
  },
  {
    'Threat_ID': 'THR-2024-009',
    'Threat_Type': 'Malware',
    'Indicator': 'suspicious-update.exe',
    'Indicator_Type': 'Filename',
    'Severity': 'Medium',
    'Confidence': '75',
    'First_Seen': '2024-01-23',
    'Last_Seen': '2024-01-29',
    'Source': 'Endpoint Detection',
    'Description': 'Suspicious executable masquerading as update',
    'Tags': 'malware,masquerading'
  },
  {
    'Threat_ID': 'THR-2024-010',
    'Threat_Type': 'Vulnerability',
    'Indicator': 'CVE-2024-5678',
    'Indicator_Type': 'CVE',
    'Severity': 'High',
    'Confidence': '100',
    'First_Seen': '2024-01-24',
    'Last_Seen': '2024-01-30',
    'Source': 'Security Advisory',
    'Description': 'SQL injection vulnerability in web application',
    'Tags': 'sqli,web-vulnerability,injection'
  }
];

// Create a new workbook
const workbook = XLSX.utils.book_new();

// Convert data to worksheet
const worksheet = XLSX.utils.json_to_sheet(threatData);

// Set column widths for better readability
worksheet['!cols'] = [
  { wch: 15 },  // Threat_ID
  { wch: 15 },  // Threat_Type
  { wch: 40 },  // Indicator
  { wch: 15 },  // Indicator_Type
  { wch: 10 },  // Severity
  { wch: 10 },  // Confidence
  { wch: 12 },  // First_Seen
  { wch: 12 },  // Last_Seen
  { wch: 20 },  // Source
  { wch: 50 },  // Description
  { wch: 30 }   // Tags
];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Threat Intelligence');

// Write to file
XLSX.writeFile(workbook, 'sample-threat-data.xlsx');

console.log('✓ Sample XLSX file created: sample-threat-data.xlsx');
console.log('✓ Contains 10 threat intelligence records');
console.log('✓ Ready to test with Feed Parser');
