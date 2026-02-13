'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';

interface RadarNotFoundHandlerProps {
  radarId: string;
}

interface RadarData {
  id: string;
  name: string;
  description: string;
  type: string;
  level: string;
  cluster: string;
  totalTrends: number;
  lastModified: string;
  trends: string[];
}

export function RadarNotFoundHandler({ radarId }: RadarNotFoundHandlerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [radarData, setRadarData] = useState<RadarData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const checkForNewRadar = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/regenerate');
      
      // For static export, API calls will fail
      if (response.status === 404) {
        setError('Dynamic radar checking is not available in static export. Please rebuild the site to see new radars.');
        return;
      }
      
      const data = await response.json();

      if (data.success) {
        const foundRadar = data.radars.find((radar: RadarData) => radar.id === radarId);
        
        if (foundRadar) {
          setRadarData(foundRadar);
          // Redirect to the radar page
          router.push(`/${radarId}`);
          return;
        }
      }

      setError('Radar not found in the latest data');
    } catch (err) {
      setError('Failed to check for new radar data');
      console.error('Error checking for new radar:', err);
    } finally {
      setIsLoading(false);
    }
  }, [radarId, router]);

  useEffect(() => {
    // Automatically check for new radar data when component mounts
    checkForNewRadar();
  }, [checkForNewRadar]);

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Radar Not Found
          </CardTitle>
          <CardDescription>
            The radar with ID &quot;{radarId}&quot; was not found. This might be a new radar that hasn&apos;t been built yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {radarData && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                Found radar: <strong>{radarData.name}</strong>
              </p>
              <p className="text-xs text-green-600 mt-1">
                Redirecting to radar page...
              </p>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={checkForNewRadar} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check for New Radar
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
            >
              Go Home
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>This can happen when:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>A new radar was recently created in Airtable</li>
              <li>The static site hasn&apos;t been rebuilt yet</li>
              <li>There&apos;s a temporary connection issue</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 