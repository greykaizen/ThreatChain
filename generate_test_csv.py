#!/usr/bin/env python3
"""
Generate a test CSV file with threat intelligence data
This proves the system works with ANY CSV file, not hardcoded data
"""

import csv
import random
from datetime import datetime, timedelta

# Define possible values for each field
indicator_types = ["ipv4-addr", "domain", "url", "file-hash", "email"]
threat_types = ["malware", "phishing", "ransomware", "c2-server", "ddos", "spam", "trojan"]
sources = ["OpenCTI", "MISP", "OSINT", "AlienVault", "VirusTotal", "User Upload"]
severities = ["low", "medium", "high", "critical"]

def generate_indicator_value(indicator_type):
    """Generate a realistic indicator value based on type"""
    if indicator_type == "ipv4-addr":
        return f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 255)}"
    elif indicator_type == "domain":
        domains = ["malicious-site", "evil-domain", "fake-bank", "phishing-page", "bad-actor"]
        tlds = [".com", ".net", ".org", ".ru", ".cn"]
        return f"{random.choice(domains)}{random.choice(tlds)}"
    elif indicator_type == "url":
        return f"http://{generate_indicator_value('domain')}/payload"
    elif indicator_type == "file-hash":
        return ''.join(random.choices('0123456789abcdef', k=32))
    elif indicator_type == "email":
        names = ["attacker", "spammer", "hacker", "malicious"]
        return f"{random.choice(names)}@{generate_indicator_value('domain')}"

def generate_timestamp():
    """Generate a random timestamp within the last 30 days"""
    days_ago = random.randint(0, 30)
    hours_ago = random.randint(0, 23)
    minutes_ago = random.randint(0, 59)
    dt = datetime.now() - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")

def generate_description(threat_type, indicator_value):
    """Generate a description based on threat type"""
    descriptions = {
        "malware": f"Malicious activity detected from {indicator_value}",
        "phishing": f"Phishing campaign using {indicator_value}",
        "ransomware": f"Ransomware distribution via {indicator_value}",
        "c2-server": f"Command and control server at {indicator_value}",
        "ddos": f"DDoS attack originating from {indicator_value}",
        "spam": f"Spam campaign source: {indicator_value}",
        "trojan": f"Trojan detected at {indicator_value}"
    }
    return descriptions.get(threat_type, f"Threat detected: {indicator_value}")

# Generate CSV file
def generate_csv(filename, num_rows=50):
    """Generate a CSV file with threat intelligence data"""
    
    headers = [
        "indicator_type",
        "indicator_value", 
        "threat_type",
        "confidence",
        "timestamp",
        "source",
        "description",
        "severity",
        "tlp",
        "tags"
    ]
    
    with open(filename, 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=headers)
        writer.writeheader()
        
        for _ in range(num_rows):
            indicator_type = random.choice(indicator_types)
            threat_type = random.choice(threat_types)
            indicator_value = generate_indicator_value(indicator_type)
            
            row = {
                "indicator_type": indicator_type,
                "indicator_value": indicator_value,
                "threat_type": threat_type,
                "confidence": random.randint(60, 99),
                "timestamp": generate_timestamp(),
                "source": random.choice(sources),
                "description": generate_description(threat_type, indicator_value),
                "severity": random.choice(severities),
                "tlp": random.choice(["white", "green", "amber", "red"]),
                "tags": f'["{threat_type}", "apt", "threat"]'
            }
            writer.writerow(row)
    
    print(f"✅ Generated {filename} with {num_rows} rows")
    print(f"📊 Columns: {', '.join(headers)}")
    print(f"\n🎯 Now upload this file in the ThreadChain web interface!")

if __name__ == "__main__":
    generate_csv("generated-threat-data.csv", num_rows=100)
