import { useState, useEffect } from 'react';

export function useIPAddress() {
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIPAddress = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try multiple IP services for reliability
        const services = [
          'https://api.ipify.org?format=json',
          'https://ipapi.co/json/',
          'https://ipinfo.io/json'
        ];
        
        for (const service of services) {
          try {
            const response = await fetch(service);
            if (response.ok) {
              const data = await response.json();
              // Different services return IP in different field names
              const ip = data.ip || data.query || data.origin;
              if (ip) {
                setIpAddress(ip);
                return;
              }
            }
          } catch (serviceError) {
            console.warn(`Failed to fetch IP from ${service}:`, serviceError);
          }
        }
        
        throw new Error('All IP services failed');
      } catch (err) {
        console.error('Error fetching IP address:', err);
        setError('Failed to fetch IP address');
        // Fallback - we'll still allow orders but without IP logging
        setIpAddress(null);
      } finally {
        setLoading(false);
      }
    };

    fetchIPAddress();
  }, []);

  const refreshIP = () => {
    setIpAddress(null);
    setLoading(true);
    setError(null);
    // Trigger useEffect to fetch again
    // We could improve this by extracting the fetch logic to a separate function
  };

  return {
    ipAddress,
    loading,
    error,
    refreshIP
  };
}

// Standalone function for getting IP address when needed
export async function getCurrentIPAddress(): Promise<string | null> {
  const services = [
    'https://api.ipify.org?format=json',
    'https://ipapi.co/json/',
    'https://ipinfo.io/json'
  ];
  
  for (const service of services) {
    try {
      const response = await fetch(service);
      if (response.ok) {
        const data = await response.json();
        const ip = data.ip || data.query || data.origin;
        if (ip) {
          return ip;
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch IP from ${service}:`, error);
    }
  }
  
  console.error('All IP services failed');
  return null;
}