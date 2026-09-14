// ============================================================
// CREATIVE GENERATION ADAPTER (Mock / Production)
// ============================================================

export interface GeneratedCreative {
  assetUrl: string;
  thumbnailUrl: string;
  copyText: string;
  headline: string;
  ctaText: string;
  dimensions: { width: number; height: number };
}

export class MockCreativeProvider {
  async generateBrochureCard(data: {
    customerName: string;
    projectName: string;
    unitType: string;
    priceRange: string;
    objectionHighlight?: string;
  }): Promise<GeneratedCreative> {
    return {
      assetUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
      headline: `Exclusive ${data.unitType} at ${data.projectName} — Tailored for ${data.customerName}`,
      copyText: `Hi ${data.customerName}, following up on your discussion with our ground advisor Aman. Discover premium 3BHK living with unmatched ROI in Sector 62. Starting at ${data.priceRange}. Zero compromise on luxury.`,
      ctaText: 'View Virtual Tour & Price Breakdown',
      dimensions: { width: 1080, height: 1080 },
    };
  }

  async generateComparisonSheet(data: {
    projectName: string;
    competitorName: string;
    amenities: string[];
    priceDiff: string;
  }): Promise<GeneratedCreative> {
    return {
      assetUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80',
      headline: `${data.projectName} vs ${data.competitorName}: Clear Value Comparison`,
      copyText: `Why ${data.projectName} delivers 18% higher capital appreciation, 2x clubhouse amenities, and RERA certified delivery 6 months ahead of schedule.`,
      ctaText: 'Download Comparative Analysis PDF',
      dimensions: { width: 1200, height: 630 },
    };
  }
}

export function getCreativeProvider() {
  return new MockCreativeProvider();
}
