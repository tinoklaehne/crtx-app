import { NextRequest, NextResponse } from 'next/server';
import { getRadar } from '@/lib/airtable/radars';
import { getClusters, getTechnologies } from '@/lib/airtable/general';
import type { Cluster } from '@/app/types/clusters';
import type { Trend } from '@/app/types/trends';
import type { Radar } from '@/app/types/radars';

// Required for static export compatibility
export const dynamic = 'force-static';

export async function POST(request: NextRequest) {
  try {
    const { radarId, clusterType } = await request.json();

    if (!radarId) {
      return NextResponse.json({ error: 'Radar ID is required' }, { status: 400 });
    }

    if (!clusterType || !['parent', 'taxonomy', 'domain'].includes(clusterType)) {
      return NextResponse.json({ error: 'Valid cluster type is required' }, { status: 400 });
    }

    console.log(`Refetching radar data for ${radarId} with cluster type: ${clusterType}`);

    // Fetch radar data
    const radar = await getRadar(radarId);
    if (!radar) {
      return NextResponse.json({ error: 'Radar not found' }, { status: 404 });
    }

    const universe = radar.type === "Travel" ? "Travel" : "General";

    // Fetch clusters and technologies with the new cluster type
    const [clustersData, technologiesData] = await Promise.all([
      getClusters(clusterType, universe),
      getTechnologies(clusterType, universe),
    ]);

    console.log(`Found ${clustersData.length} clusters and ${technologiesData.length} technologies`);

    // Filter technologies to only include those in the radar's trends list
    const filteredTechnologies = technologiesData.filter((tech) =>
      radar.trends.includes(tech.id)
    );

    console.log(`Filtered to ${filteredTechnologies.length} technologies for this radar`);

    // Debug: Log some technology details to understand the data structure
    if (filteredTechnologies.length > 0) {
      console.log('Sample technology data:', {
        id: filteredTechnologies[0].id,
        name: filteredTechnologies[0].name,
        clusterId: filteredTechnologies[0].clusterId,
        taxonomyId: filteredTechnologies[0].taxonomyId,
        domain: filteredTechnologies[0].domain
      });
    }

    // Filter clusters to only include those that have technologies
    const activeClusters = clustersData.filter((cluster) =>
      filteredTechnologies.some((tech) => {
        const techClusterId = clusterType === "taxonomy" ? tech.taxonomyId : tech.clusterId;
        return techClusterId === cluster.id;
      })
    );

    console.log(`Final result: ${activeClusters.length} clusters and ${filteredTechnologies.length} technologies`);
    
    // Debug: Log cluster details
    if (activeClusters.length > 0) {
      console.log('Sample cluster data:', {
        id: activeClusters[0].id,
        name: activeClusters[0].name,
        domain: activeClusters[0].domain
      });
    }

    return NextResponse.json({
      radar,
      clusters: activeClusters,
      technologies: filteredTechnologies,
      clusterType
    });

  } catch (error) {
    console.error('Error refetching radar data:', error);
    return NextResponse.json(
      { error: 'Failed to refetch radar data' },
      { status: 500 }
    );
  }
} 